import type { BuiltInAIModel } from "./descriptor";
import { BuiltInAIUnavailableError } from "./errors";
import { createStore, type Store } from "./store";
import type { BuiltInAIStatic, BuiltInAIStatus } from "./types";

export interface BuiltInAIHandle<
  TCall,
  TInput,
  TOutput,
  TStreaming extends boolean,
> {
  getStatus: () => BuiltInAIStatus;
  subscribe: (listener: () => void) => () => void;
  run: (input: TInput, options?: TCall) => Promise<TOutput>;
  stream: TStreaming extends true
    ? (input: TInput, options?: TCall) => AsyncIterable<string>
    : undefined;
  release: () => void;
}

interface Entry {
  instance: Promise<DestroyableModel> | null;
  refCount: number;
  store: Store<BuiltInAIStatus>;
  controller: AbortController;
  teardown: ReturnType<typeof setTimeout> | null;
}

const registry = new Map<string, Entry>();

const noop = () => undefined;

function teardownEntry(entry: Entry): void {
  entry.controller.abort();
  const pending = entry.instance;
  if (pending) {
    void pending.then((instance) => instance.destroy(), noop);
  }
}

/**
 * Resolve the stable reuse key (and the normalized options behind it) for
 * `model` + `options`. Owned here so the registry and its React binding
 * derive identity from one formula and can never drift apart.
 */
export function identityKey<TCreate>(
  model: Pick<
    BuiltInAIModel<TCreate, unknown, unknown, unknown, boolean>,
    "name" | "identity" | "normalize" | "defaults"
  >,
  options: TCreate,
): { key: string; normalized: TCreate } {
  const normalized = model.normalize({ ...model.defaults, ...options });
  return { key: `${model.name}::${model.identity(normalized)}`, normalized };
}

async function loadInstance<TCreate>(
  api: BuiltInAIStatic<TCreate>,
  model: Pick<
    BuiltInAIModel<TCreate, unknown, unknown, unknown, boolean>,
    "availabilityArgs"
  >,
  options: TCreate,
  store: Store<BuiltInAIStatus>,
  controller: AbortController,
): Promise<DestroyableModel> {
  const availability = await api.availability(model.availabilityArgs(options));
  store.setState({
    availability,
    progress: availability === "available" ? 1 : 0,
  });
  if (availability === "unavailable") {
    throw new BuiltInAIUnavailableError("unavailable");
  }

  const instance = await api.create({
    ...(options as object),
    signal: controller.signal,
    monitor: (monitor: CreateMonitor) => {
      monitor.addEventListener("downloadprogress", (event) => {
        store.setState({
          availability: "downloading",
          progress: event.loaded,
        });
      });
    },
  } as TCreate & {
    signal?: AbortSignal;
    monitor?: (monitor: CreateMonitor) => void;
  });

  store.setState({ availability: "available", progress: 1 });
  return instance;
}

function createEntry<TCreate>(
  model: Pick<
    BuiltInAIModel<TCreate, unknown, unknown, unknown, boolean>,
    "resolve" | "availabilityArgs"
  >,
  options: TCreate,
): Entry {
  const controller = new AbortController();
  const store = createStore<BuiltInAIStatus>({
    availability: "unsupported",
    progress: 0,
  });
  const entry: Entry = {
    instance: null,
    refCount: 0,
    store,
    controller,
    teardown: null,
  };

  const api = model.resolve();
  if (!api) {
    return entry; // unsupported — instance stays null
  }

  entry.instance = loadInstance(api, model, options, store, controller);

  // Keep an attached handler so a pre-await failure is never an unhandled
  // rejection; callers still observe the rejection via `run`/`stream`.
  entry.instance.catch(noop);

  return entry;
}

async function* iterate<TCall, TInput>(
  stream: (
    instance: unknown,
    input: TInput,
    options?: TCall,
  ) => ReadableStream<string>,
  entry: Entry,
  input: TInput,
  options?: TCall,
): AsyncIterable<string> {
  const instance = entry.instance ? await entry.instance : null;
  if (!instance) {
    throw new BuiltInAIUnavailableError(entry.store.getSnapshot().availability);
  }
  const reader = stream(instance, input, options).getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Acquire a reference to the shared, ref-counted instance for `model` +
 * `options`. The same logical options reuse the same on-device model; the
 * instance is destroyed only once the last reference is released.
 */
export function acquire<
  TCreate,
  TCall,
  TInput,
  TOutput,
  TStreaming extends boolean,
>(
  model: BuiltInAIModel<TCreate, TCall, TInput, TOutput, TStreaming>,
  options: TCreate,
): BuiltInAIHandle<TCall, TInput, TOutput, TStreaming> {
  const { key, normalized } = identityKey(model, options);

  let entry = registry.get(key);
  if (!entry) {
    entry = createEntry(model, normalized);
    registry.set(key, entry);
  } else if (entry.teardown !== null) {
    clearTimeout(entry.teardown);
    entry.teardown = null;
  }
  entry.refCount += 1;

  const acquiredEntry = entry;
  let released = false;

  const streamFn = model.stream
    ? (input: TInput, callOptions?: TCall): AsyncIterable<string> =>
        iterate(model.stream!, acquiredEntry, input, callOptions)
    : undefined;

  return {
    getStatus: acquiredEntry.store.getSnapshot,
    subscribe: acquiredEntry.store.subscribe,
    run: async (input, callOptions) => {
      const instance = acquiredEntry.instance
        ? await acquiredEntry.instance
        : null;
      if (!instance) {
        throw new BuiltInAIUnavailableError(
          acquiredEntry.store.getSnapshot().availability,
        );
      }
      return model.run(instance, input, callOptions);
    },
    stream: streamFn as BuiltInAIHandle<
      TCall,
      TInput,
      TOutput,
      TStreaming
    >["stream"],
    release: () => {
      if (released) {
        return;
      }
      released = true;
      acquiredEntry.refCount -= 1;
      if (acquiredEntry.refCount > 0) {
        return;
      }
      // Defer teardown one tick so a StrictMode remount or a rapid option
      // flip can re-acquire the same instance instead of re-downloading it.
      acquiredEntry.teardown = setTimeout(() => {
        if (acquiredEntry.refCount > 0) {
          return;
        }
        teardownEntry(acquiredEntry);
        registry.delete(key);
      }, 0);
    },
  };
}

/** Test-only: drop all cached instances and timers. */
export function resetRegistry(): void {
  for (const entry of registry.values()) {
    if (entry.teardown !== null) {
      clearTimeout(entry.teardown);
    }
    teardownEntry(entry);
  }
  registry.clear();
}
