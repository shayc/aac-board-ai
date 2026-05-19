import { useEffect, useState, useSyncExternalStore } from "react";
import {
  BuiltInAIError,
  NoUserActivationError,
  NotReadyError,
  UnavailableError,
  UnsupportedError,
} from "../errors.ts";
import { hasUserActivation } from "./activation.ts";
import { createInstance } from "./createInstance.ts";
import { shallowEqualOptions } from "./options-equality.ts";
import { abortError, mergeSignals, raceAbort } from "./signal.ts";
import type { AINamespace, DestroyableInstance, Status } from "./types.ts";

interface Snapshot {
  status: Status;
  progress: number;
  error: BuiltInAIError | null;
  inputQuota: number;
}

export interface Acquired<Instance> {
  instance: Instance;
  signal: AbortSignal;
}

export interface Lifecycle<Instance> extends Snapshot {
  prepare: () => Promise<void>;
  acquire: (callerSignal?: AbortSignal) => Promise<Acquired<Instance>>;
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

interface Store<Options extends object, Instance extends DestroyableInstance> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => Snapshot;
  prepare: () => Promise<void>;
  acquire: (callerSignal?: AbortSignal) => Promise<Acquired<Instance>>;
  start: (
    namespace: AINamespace<Options, Instance> | undefined,
    options: Options | undefined,
  ) => void;
  stop: () => void;
}

function createStore<
  Options extends object,
  Instance extends DestroyableInstance,
>(globalName: string): Store<Options, Instance> {
  let snapshot: Snapshot = INITIAL;
  const listeners = new Set<() => void>();

  let namespace: AINamespace<Options, Instance> | undefined;
  let options: Options | undefined;
  let controller = new AbortController();
  let generation = 0;
  let instance: Instance | null = null;
  let pending: Promise<unknown> | null = null;
  let mounted = false;

  function notify(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  function update(patch: Partial<Snapshot>): void {
    snapshot = { ...snapshot, ...patch };
    notify();
  }

  function isCurrent(expected: number): boolean {
    return mounted && expected === generation;
  }

  function startCreate(
    withMonitor: boolean,
    expected: number,
  ): Promise<Instance> {
    if (withMonitor) {
      update({ status: "downloading", progress: 0 });
    }

    const promise = createInstance<Options, Instance>({
      name: globalName,
      options,
      signal: controller.signal,
      onProgress: (loaded) => {
        if (!isCurrent(expected)) {
          return;
        }
        update({ progress: loaded });
      },
    });
    pending = promise;

    promise.then(
      (created) => {
        if (!isCurrent(expected)) {
          destroyQuietly(created);
          return;
        }
        instance = created;
        pending = null;
        update({
          status: "ready",
          progress: 0,
          error: null,
          inputQuota: readQuota(created),
        });
      },
      (error) => {
        if (!isCurrent(expected)) {
          return;
        }
        pending = null;
        // Map the primitive's typed rejections back to terminal states; only
        // genuine create failures land in "error".
        if (error instanceof UnsupportedError) {
          update({ status: "unsupported", progress: 0, error: null });
        } else if (error instanceof UnavailableError) {
          update({ status: "unavailable", progress: 0, error: null });
        } else {
          update({ status: "error", progress: 0, error: wrap(error) });
        }
      },
    );

    return promise;
  }

  function runAvailabilityChain(expected: number): void {
    const ns = namespace;
    if (!ns) {
      return;
    }
    const opts = options;
    const chain = ns.availability(opts).then(
      (availability) => {
        if (!isCurrent(expected)) {
          return;
        }
        if (availability === "unavailable") {
          pending = null;
          update({ status: "unavailable" });
          return;
        }
        if (availability === "available") {
          return startCreate(false, expected).then(
            () => undefined,
            () => undefined,
          );
        }
        pending = null;
      },
      (error) => {
        if (!isCurrent(expected)) {
          return;
        }
        pending = null;
        update({ status: "error", progress: 0, error: wrap(error) });
      },
    );
    pending = chain;
  }

  function start(
    nextNamespace: AINamespace<Options, Instance> | undefined,
    nextOptions: Options | undefined,
  ): void {
    controller.abort(abortError("lifecycle reset"));
    namespace = nextNamespace;
    options = nextOptions;
    generation += 1;
    controller = new AbortController();
    mounted = true;
    instance = null;
    pending = null;
    snapshot = {
      status: nextNamespace ? "idle" : "unsupported",
      progress: 0,
      error: null,
      inputQuota: 0,
    };
    notify();
    runAvailabilityChain(generation);
  }

  function stop(): void {
    mounted = false;
    controller.abort(abortError("lifecycle reset"));
    pending = null;
    const toDestroy = instance;
    instance = null;
    destroyQuietly(toDestroy);
  }

  async function awaitPending(
    promise: Promise<unknown>,
    callerSignal: AbortSignal | undefined,
  ): Promise<void> {
    const merged = mergeSignals(controller.signal, callerSignal);
    try {
      await raceAbort(promise, merged);
    } catch (err) {
      if (merged.aborted) {
        throw err;
      }
      // Underlying rejections settle into snapshot.error; only caller-aborts surface here.
    }
  }

  async function acquire(
    callerSignal?: AbortSignal,
  ): Promise<Acquired<Instance>> {
    for (;;) {
      switch (snapshot.status) {
        case "ready": {
          const merged = mergeSignals(controller.signal, callerSignal);
          if (merged.aborted) {
            throw merged.reason;
          }
          return { instance: instance!, signal: merged };
        }
        case "unsupported":
          throw new UnsupportedError();
        case "unavailable":
          throw new UnavailableError();
        case "error":
          throw new NotReadyError(snapshot.error?.cause);
        case "downloading":
          await awaitPending(pending!, callerSignal);
          continue;
        case "idle": {
          if (pending) {
            await awaitPending(pending, callerSignal);
            continue;
          }
          if (!hasUserActivation()) {
            throw new NoUserActivationError();
          }
          void startCreate(true, generation);
          continue;
        }
      }
    }
  }

  async function prepare(): Promise<void> {
    // Entering prepare() in "error" clears it and restarts the chain once.
    // Landing back in "error" (here or mid-drive) rejects — no retry loop.
    if (snapshot.status === "error") {
      start(namespace, options);
    }
    for (;;) {
      switch (snapshot.status) {
        case "ready":
          return;
        case "unsupported":
          throw new UnsupportedError();
        case "unavailable":
          throw new UnavailableError();
        case "error":
          throw new NotReadyError(snapshot.error?.cause);
        case "downloading":
          await awaitPending(pending!, undefined);
          continue;
        case "idle": {
          if (pending) {
            await awaitPending(pending, undefined);
            continue;
          }
          if (!hasUserActivation()) {
            throw new NoUserActivationError();
          }
          void startCreate(true, generation);
          continue;
        }
      }
    }
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  return {
    subscribe,
    getSnapshot: () => snapshot,
    prepare,
    acquire,
    start,
    stop,
  };
}

/** Shared lifecycle for every built-in AI namespace. Function refs are stable across renders. */
export function useLifecycle<
  Options extends object,
  Instance extends DestroyableInstance,
>(globalName: string, options: Options | undefined): Lifecycle<Instance> {
  const namespace = (globalThis as Record<string, unknown>)[globalName] as
    | AINamespace<Options, Instance>
    | undefined;

  // setState-in-render to collapse shallow-equal options to a stable reference
  // (react.dev "store info from previous renders"); the effect re-runs only on real changes.
  const [stableOptions, setStableOptions] = useState<Options | undefined>(
    options,
  );
  if (!shallowEqualOptions(stableOptions, options)) {
    setStableOptions(options);
  }

  const [store] = useState(() => createStore<Options, Instance>(globalName));

  useEffect(() => {
    store.start(namespace, stableOptions);
    return () => store.stop();
  }, [store, namespace, stableOptions]);

  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return {
    status: snapshot.status,
    progress: snapshot.progress,
    error: snapshot.error,
    inputQuota: snapshot.inputQuota,
    prepare: store.prepare,
    acquire: store.acquire,
  };
}
