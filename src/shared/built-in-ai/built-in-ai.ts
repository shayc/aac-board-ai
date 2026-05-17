/**
 * Framework-agnostic wrapper over Chrome's built-in AI APIs. Every API
 * (`Translator`, `Rewriter`, …) shares one static shape, so the whole library
 * is two functions plus types inferred straight from `@types/dom-chromium-ai`.
 * Adding an API is one line in `BuiltInAINamespaces` — nothing else changes.
 */

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

/** The `create()` options for a given API, inferred from the spec types. */
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

/** The slice of every built-in AI global we depend on. */
interface AINamespace<O, I> {
  availability(options?: O): Promise<Availability>;
  create(
    options?: O & {
      signal?: AbortSignal;
      monitor?: (monitor: CreateMonitor) => void;
    },
  ): Promise<I>;
}

/**
 * The one structural assertion in the module: built-in AI globals are ambient
 * and may be absent, so the lookup is untyped and narrowed here once.
 */
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
  // `onProgress` rides along via spread (exempt from excess-property checks)
  // and is harmlessly ignored by the native `create()`.
  return namespace.create({
    ...options,
    monitor: (monitor) =>
      monitor.addEventListener("downloadprogress", (event) => {
        onProgress?.(event.loaded);
      }),
  });
}
