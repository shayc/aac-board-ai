export interface BuiltInAINamespaces {
  Translator: typeof Translator;
  Rewriter: typeof Rewriter;
  Proofreader: typeof Proofreader;
  Summarizer: typeof Summarizer;
  Writer: typeof Writer;
  LanguageDetector: typeof LanguageDetector;
  LanguageModel: typeof LanguageModel;
}

export type BuiltInAIName = keyof BuiltInAINamespaces;

/**
 * The `create()` options for a given API, inferred from the spec types.
 * `monitor` and `signal` are owned by this module — values passed for them
 * are overridden by the wrapper. (Not excluded at the type level because
 * `Omit` over a generic blocks spread inference at the call sites.)
 */
export type CreateOptions<K extends BuiltInAIName> = NonNullable<
  Parameters<BuiltInAINamespaces[K]["create"]>[0]
>;

/** The session instance a given API's `create()` resolves to. */
export type Session<K extends BuiltInAIName> = Awaited<
  ReturnType<BuiltInAINamespaces[K]["create"]>
>;

/** Spec `Availability` plus our `"unsupported"` for a missing global. */
export type AvailabilityStatus = "unsupported" | Availability;

export interface CreateSessionOptions {
  signal?: AbortSignal;
  /** Model download progress, a `0..1` fraction. */
  onProgress?: (fraction: number) => void;
}

interface AINamespace<Options, Instance> {
  availability(options?: Options): Promise<Availability>;
  create(
    options?: Options & {
      signal?: AbortSignal;
      monitor?: (monitor: CreateMonitor) => void;
    },
  ): Promise<Instance>;
}

function getNamespace<K extends BuiltInAIName>(
  name: K,
): AINamespace<CreateOptions<K>, Session<K>> | undefined {
  if (!(name in globalThis)) {
    return undefined;
  }
  const globals = globalThis as unknown as Record<
    K,
    AINamespace<CreateOptions<K>, Session<K>>
  >;
  return globals[name];
}

/** Resolve the model's availability, or `"unsupported"` when absent. */
export async function availability<K extends BuiltInAIName>(
  name: K,
  options?: CreateOptions<K>,
): Promise<AvailabilityStatus> {
  const namespace = getNamespace(name);
  if (!namespace) {
    return "unsupported";
  }
  return namespace.availability(options);
}

/**
 * Create a session, awaiting any model download (progress via `onProgress`).
 * Resolves `null` only when the model cannot be used (unsupported or
 * `"unavailable"`); genuine `create()` failures reject so they can't be
 * silently ignored.
 */
export async function createSession<K extends BuiltInAIName>(
  name: K,
  options?: CreateOptions<K> & CreateSessionOptions,
): Promise<Session<K> | null> {
  const namespace = getNamespace(name);
  if (!namespace) {
    return null;
  }
  if ((await namespace.availability(options)) === "unavailable") {
    return null;
  }

  const onProgress = options?.onProgress;
  return namespace.create({
    ...options,
    monitor: (monitor) =>
      monitor.addEventListener("downloadprogress", (event) => {
        onProgress?.(event.loaded);
      }),
  });
}
