import {
  BuiltInAIError,
  NoUserActivationError,
  NotReadyError,
  UnavailableError,
  UnsupportedError,
} from "../../errors";
import type { BuiltInAIName } from "../../is-supported";
import type { Status } from "../../types";
import { abortError, mergeSignals, raceAbort } from "../signal";
import { hasUserActivation } from "../user-activation";
import { createInstance } from "./create-instance";
import type { AINamespace } from "./types";

export interface Snapshot {
  status: Status;
  progress: number;
  error: BuiltInAIError | null;
  inputQuota: number;
}

export interface Acquired<Model> {
  instance: Model;
  signal: AbortSignal;
}

const INITIAL_SNAPSHOT: Snapshot = {
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

function destroyQuietly(instance: DestroyableModel | null | undefined): void {
  if (!instance) {
    return;
  }
  try {
    instance.destroy();
  } catch {
    // Best-effort during teardown — a throw here has nowhere to go.
  }
}

export function createStore<
  Options extends object,
  Model extends DestroyableModel,
>(globalName: BuiltInAIName, readQuota: (instance: Model) => number = () => 0) {
  let snapshot: Snapshot = INITIAL_SNAPSHOT;
  const listeners = new Set<() => void>();

  let namespace: AINamespace<Options, Model> | undefined;
  let options: Options | undefined;
  let instance: Model | null = null;
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
        await provision(signal, { showDownloadUI: false });
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
  interface ProvisionOptions {
    showDownloadUI: boolean;
  }

  async function provision(
    signal: AbortSignal,
    { showDownloadUI }: ProvisionOptions,
  ): Promise<void> {
    if (showDownloadUI) {
      update({ status: "downloading", progress: 0 });
    }
    try {
      const created = await createInstance<Options, Model>({
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
    } catch (error) {
      if (merged.aborted) {
        throw error;
      }
      // Underlying rejections settle into snapshot.error; only caller-aborts surface here.
    }
  }

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
      activeTask = provision(abortController.signal, { showDownloadUI: true });
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
    nextNamespace: AINamespace<Options, Model> | undefined,
    nextOptions: Options | undefined,
  ): void {
    abortController.abort(abortError("lifecycle reset"));
    abortController = new AbortController();
    namespace = nextNamespace;
    options = nextOptions;
    destroyQuietly(instance);
    instance = null;
    snapshot = {
      ...INITIAL_SNAPSHOT,
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
  ): Promise<Acquired<Model>> => {
    await ensureReady(callerSignal);
    const merged = mergeSignals(abortController.signal, callerSignal);
    if (merged.aborted) {
      throw merged.reason;
    }
    // start()/stop() during the await nulls instance under a fresh (unaborted) controller.
    if (!instance) {
      throw new NotReadyError();
    }
    return { instance, signal: merged };
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
