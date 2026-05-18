import { useEffect, useState, useSyncExternalStore } from "react";
import {
  BuiltInAIError,
  NoUserActivationError,
  NotReadyError,
  UnavailableError,
  UnsupportedError,
} from "../errors.ts";
import { hasUserActivation } from "./activation.ts";
import {
  buildProgressKey,
  clearDownloadProgress,
  setDownloadProgress,
} from "./progress-store.ts";
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
  const value = (instance as Record<PropertyKey, unknown>).inputQuota;
  return typeof value === "number" ? value : 0;
}

function safeDestroy(instance: DestroyableInstance | null | undefined): void {
  if (instance) {
    try {
      instance.destroy?.();
    } catch {
      /* swallow */
    }
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
  let progressKey: string | null = null;
  let controller = new AbortController();
  let generation = 0;
  let instance: Instance | null = null;
  let pending: Promise<unknown> | null = null;
  let pendingCreate: Promise<Instance> | null = null;
  let mounted = false;

  function notify(): void {
    for (const l of listeners) {
      l();
    }
  }

  function update(patch: Partial<Snapshot>): void {
    snapshot = { ...snapshot, ...patch };
    notify();
  }

  function isCurrent(g: number): boolean {
    return mounted && g === generation;
  }

  function startCreate(withMonitor: boolean, g: number): Promise<Instance> {
    const ns = namespace!;
    const opts = options;
    const signal = controller.signal;
    const key = progressKey;

    update({ status: "downloading", progress: 0 });

    const monitor = withMonitor
      ? (m: CreateMonitor) => {
          m.addEventListener("downloadprogress", (event) => {
            if (!isCurrent(g)) {
              return;
            }
            update({ progress: event.loaded });
            if (key) {
              setDownloadProgress(key, event.loaded);
            }
          });
        }
      : undefined;

    const promise = ns.create({
      ...opts!,
      signal,
      monitor,
    });
    pending = promise;
    pendingCreate = promise;

    promise.then(
      (created) => {
        if (key) {
          clearDownloadProgress(key);
        }
        if (!isCurrent(g)) {
          safeDestroy(created);
          return;
        }
        instance = created;
        pending = null;
        pendingCreate = null;
        update({
          status: "ready",
          progress: 0,
          error: null,
          inputQuota: readQuota(created),
        });
      },
      (error) => {
        if (key) {
          clearDownloadProgress(key);
        }
        if (!isCurrent(g)) {
          return;
        }
        pending = null;
        pendingCreate = null;
        update({ status: "error", error: wrap(error) });
      },
    );

    return promise;
  }

  function runChain(g: number): void {
    const ns = namespace;
    if (!ns) {
      return;
    }
    const opts = options;
    const chain = ns.availability(opts).then(
      (availability) => {
        if (!isCurrent(g)) {
          return;
        }
        if (availability === "unavailable") {
          pending = null;
          update({ status: "unavailable" });
          return;
        }
        if (availability === "available") {
          return startCreate(false, g).then(
            () => undefined,
            () => undefined,
          );
        }
        pending = null;
      },
      (error) => {
        if (!isCurrent(g)) {
          return;
        }
        pending = null;
        update({ status: "error", error: wrap(error) });
      },
    );
    pending = chain;
  }

  function start(
    nextNamespace: AINamespace<Options, Instance> | undefined,
    nextOptions: Options | undefined,
  ): void {
    namespace = nextNamespace;
    options = nextOptions;
    progressKey = nextNamespace
      ? buildProgressKey(globalName, nextOptions)
      : null;
    generation += 1;
    controller = new AbortController();
    mounted = true;
    instance = null;
    pending = null;
    pendingCreate = null;
    snapshot = {
      status: nextNamespace ? "idle" : "unsupported",
      progress: 0,
      error: null,
      inputQuota: 0,
    };
    notify();
    runChain(generation);
  }

  function stop(): void {
    mounted = false;
    controller.abort(abortError("lifecycle reset"));
    pending = null;
    pendingCreate = null;
    if (progressKey) {
      clearDownloadProgress(progressKey);
    }
    const toDestroy = instance;
    instance = null;
    safeDestroy(toDestroy);
  }

  async function awaitPending(
    p: Promise<unknown>,
    callerSignal: AbortSignal | undefined,
  ): Promise<void> {
    const merged = mergeSignals(controller.signal, callerSignal);
    try {
      await raceAbort(p, merged);
    } catch (err) {
      if (merged.aborted) {
        throw err;
      }
      // Underlying rejection has been classified into snapshot state already.
    }
  }

  async function acquire(
    callerSignal?: AbortSignal,
  ): Promise<Acquired<Instance>> {
    for (;;) {
      switch (snapshot.status) {
        case "unsupported":
          throw new UnsupportedError("Built-in AI is not supported");
        case "unavailable":
          throw new UnavailableError("Built-in AI model is unavailable");
        case "error":
          throw new NotReadyError("Built-in AI is in an error state", {
            cause: snapshot.error,
          });
        case "ready": {
          const merged = mergeSignals(controller.signal, callerSignal);
          if (merged.aborted) {
            throw merged.reason;
          }
          return { instance: instance!, signal: merged };
        }
        case "downloading":
          await awaitPending(pendingCreate!, callerSignal);
          continue;
        case "idle": {
          if (pending) {
            await awaitPending(pending, callerSignal);
            continue;
          }
          if (!hasUserActivation()) {
            throw new NoUserActivationError(
              "Built-in AI requires a user activation to download",
            );
          }
          void startCreate(true, generation);
          continue;
        }
      }
    }
  }

  async function prepare(): Promise<void> {
    for (;;) {
      switch (snapshot.status) {
        case "ready":
          return;
        case "unsupported":
          throw new UnsupportedError("Built-in AI is not supported");
        case "unavailable":
          throw new UnavailableError("Built-in AI model is unavailable");
        case "error":
          start(namespace, options);
          continue;
        case "downloading":
          await awaitPending(pendingCreate!, undefined);
          continue;
        case "idle": {
          if (pending) {
            await awaitPending(pending, undefined);
            continue;
          }
          if (!hasUserActivation()) {
            throw new NoUserActivationError(
              "Built-in AI requires a user activation to download",
            );
          }
          void startCreate(true, generation);
          continue;
        }
      }
    }
  }

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    prepare,
    acquire,
    start,
    stop,
  };
}

/**
 * Stable shared lifecycle for every built-in AI namespace. Owns the
 * availability → create → ready state machine, gates download triggers behind
 * a user activation, and exposes a single `acquire` that action methods use
 * to obtain a live instance.
 */
export function useLifecycle<
  Options extends object,
  Instance extends DestroyableInstance,
>(globalName: string, options: Options | undefined): Lifecycle<Instance> {
  const namespace = (globalThis as Record<string, unknown>)[globalName] as
    | AINamespace<Options, Instance>
    | undefined;

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
