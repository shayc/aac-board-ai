import {
  BuiltInAIError,
  NoUserActivationError,
  NotReadyError,
  UnavailableError,
  UnsupportedError,
} from "../errors.ts";
import { abortError, mergeSignals, raceAbort } from "../util/signal.ts";
import { hasUserActivation } from "./activation.ts";
import { createInstance } from "./create-instance.ts";
import type { AINamespace, DestroyableInstance, Status } from "./types.ts";

export interface Snapshot {
  status: Status;
  progress: number;
  error: BuiltInAIError | null;
  inputQuota: number;
}

export interface Acquired<Instance> {
  instance: Instance;
  signal: AbortSignal;
}

const INITIAL: Snapshot = {
  status: "idle",
  progress: 0,
  error: null,
  inputQuota: 0,
};

function wrap(error: unknown): BuiltInAIError {
  if (error instanceof BuiltInAIError) {
    return error;
  }
  return new BuiltInAIError(
    error instanceof Error ? error.message : String(error),
    { cause: error },
  );
}

function readQuota(instance: unknown): number {
  const value = (instance as { inputQuota?: unknown }).inputQuota;
  return typeof value === "number" ? value : 0;
}

function destroyQuietly(
  instance: DestroyableInstance | null | undefined,
): void {
  if (!instance) {
    return;
  }
  try {
    instance.destroy?.();
  } catch {
    // Best-effort during teardown — a throw here has nowhere to go.
  }
}

export function createStore<
  Options extends object,
  Instance extends DestroyableInstance,
>(globalName: string) {
  let snapshot: Snapshot = INITIAL;
  const listeners = new Set<() => void>();

  let namespace: AINamespace<Options, Instance> | undefined;
  let options: Options | undefined;
  let instance: Instance | null = null;
  let abortController = new AbortController();
  let activeTask: Promise<void> | null = null;

  function notify(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  function update(patch: Partial<Snapshot>): void {
    snapshot = { ...snapshot, ...patch };
    notify();
  }

  function fail(
    status: "unsupported" | "unavailable" | "error",
    error: BuiltInAIError | null = null,
  ): void {
    update({ status, progress: 0, error });
  }

  /**
   * Probe availability on start. If the model is already local we auto-provision
   * (no "downloading" UI flash); otherwise we settle into the matching state
   * and wait for a user-initiated provision via prepare/acquire.
   */
  async function checkAvailability(signal: AbortSignal): Promise<void> {
    if (!namespace) {
      return;
    }
    try {
      const availability = await namespace.availability(options);
      if (signal.aborted) {
        return;
      }
      if (availability === "unavailable") {
        fail("unavailable");
        return;
      }
      if (availability === "available") {
        await provision(signal, false);
      }
    } catch (error) {
      if (signal.aborted) {
        return;
      }
      fail("error", wrap(error));
    }
  }

  /**
   * Create the underlying instance. `showDownloadUI` flips status to
   * "downloading" first — used for user-initiated triggers where progress
   * matters; the silent path keeps an "available" model on "idle" until it
   * lands as "ready".
   */
  async function provision(
    signal: AbortSignal,
    showDownloadUI: boolean,
  ): Promise<void> {
    if (showDownloadUI) {
      update({ status: "downloading", progress: 0 });
    }
    try {
      const created = await createInstance<Options, Instance>({
        name: globalName,
        options,
        signal,
        onProgress: (loaded) => {
          if (signal.aborted) {
            return;
          }
          update({ progress: loaded });
        },
      });
      if (signal.aborted) {
        destroyQuietly(created);
        return;
      }
      instance = created;
      update({
        status: "ready",
        progress: 0,
        error: null,
        inputQuota: readQuota(created),
      });
    } catch (error) {
      if (signal.aborted) {
        return;
      }
      // Map the primitive's typed rejections back to terminal states;
      // only genuine create failures land in "error".
      if (error instanceof UnsupportedError) {
        fail("unsupported");
      } else if (error instanceof UnavailableError) {
        fail("unavailable");
      } else {
        fail("error", wrap(error));
      }
    }
  }

  async function awaitActiveTask(
    callerSignal: AbortSignal | undefined,
  ): Promise<void> {
    if (!activeTask) {
      return;
    }
    const merged = mergeSignals(abortController.signal, callerSignal);
    try {
      await raceAbort(activeTask, merged);
    } catch (err) {
      if (merged.aborted) {
        throw err;
      }
      // Underlying rejections settle into snapshot.error; only caller-aborts surface here.
    }
  }

  /**
   * Drive the lifecycle from wherever we are toward a terminal state, then
   * either return (ready) or throw the matching typed error.
   */
  async function ensureReady(callerSignal?: AbortSignal): Promise<void> {
    // 1. Background availability check may be in flight — wait it out.
    if (snapshot.status === "idle") {
      await awaitActiveTask(callerSignal);
    }

    // 2. Still idle means the model needs a user-initiated provision.
    if (snapshot.status === "idle") {
      if (!hasUserActivation()) {
        throw new NoUserActivationError();
      }
      activeTask = provision(abortController.signal, true);
    }

    // 3. Provision in flight (ours, or a concurrent caller's) — wait it out.
    if (snapshot.status === "downloading") {
      await awaitActiveTask(callerSignal);
    }

    // 4. Whatever terminal state we landed in: return or throw.
    switch (snapshot.status) {
      case "ready":
        return;
      case "unsupported":
        throw new UnsupportedError();
      case "unavailable":
        throw new UnavailableError();
      case "error":
        throw new NotReadyError(snapshot.error?.cause);
    }
    throw new Error(`Unexpected lifecycle state: ${snapshot.status}`);
  }

  function start(
    nextNamespace: AINamespace<Options, Instance> | undefined,
    nextOptions: Options | undefined,
  ): void {
    abortController.abort(abortError("lifecycle reset"));
    abortController = new AbortController();
    namespace = nextNamespace;
    options = nextOptions;
    destroyQuietly(instance);
    instance = null;
    snapshot = {
      ...INITIAL,
      status: nextNamespace ? "idle" : "unsupported",
    };
    notify();
    activeTask = checkAvailability(abortController.signal);
  }

  function stop(): void {
    abortController.abort(abortError("lifecycle unmounted"));
    activeTask = null;
    destroyQuietly(instance);
    instance = null;
  }

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const prepare = async (): Promise<void> => {
    // Re-entry from "error" clears and restarts the chain once; landing back
    // in "error" rejects — no retry loop.
    if (snapshot.status === "error") {
      start(namespace, options);
    }
    await ensureReady();
  };

  const acquire = async (
    callerSignal?: AbortSignal,
  ): Promise<Acquired<Instance>> => {
    await ensureReady(callerSignal);
    const merged = mergeSignals(abortController.signal, callerSignal);
    if (merged.aborted) {
      throw merged.reason;
    }
    return { instance: instance!, signal: merged };
  };

  return {
    subscribe,
    getSnapshot: () => snapshot,
    start,
    stop,
    prepare,
    acquire,
  };
}
