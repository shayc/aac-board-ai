import {
  clearDownloadProgress,
  setDownloadProgress,
} from "../downloadProgress";

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
 * `create()` options for a given API, inferred from the spec.
 * Pass-through, except for `monitor`, which `createSession()` owns.
 */
export type CreateOptions<K extends BuiltInAIName> = NonNullable<
  Parameters<BuiltInAINamespaces[K]["create"]>[0]
>;

/** Session instance returned by `create()` for a given API. */
export type Session<K extends BuiltInAIName> = Awaited<
  ReturnType<BuiltInAINamespaces[K]["create"]>
>;

/** Spec `Availability`, extended with `"unsupported"` for a missing global. */
export type AvailabilityStatus = "unsupported" | Availability;

export interface CreateSessionOptions {
  signal?: AbortSignal;
  /**
   * When set, download progress is reported into the shared
   * `downloadProgress` store under this key while `create()` runs, and the
   * entry is cleared on settle (resolve, reject, or abort).
   */
  progressKey?: string;
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

/** True when the API's global namespace is present in this environment. */
export function isSupported(name: BuiltInAIName): boolean {
  return name in globalThis;
}

function getNamespace<K extends BuiltInAIName>(
  name: K,
): AINamespace<CreateOptions<K>, Session<K>> | undefined {
  if (!isSupported(name)) {
    return undefined;
  }
  const globals = globalThis as unknown as Record<
    K,
    AINamespace<CreateOptions<K>, Session<K>>
  >;
  return globals[name];
}

/** Resolves the model's availability, or `"unsupported"` when the global is missing. */
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
 * Creates a session, awaiting any model download. Pass `progressKey` to have
 * download progress reported into the shared `downloadProgress` store (and
 * cleared on settle). Resolves `null` when the model cannot be used
 * (`"unsupported"` or `"unavailable"`); other `create()` failures reject.
 */
export async function createSession<K extends BuiltInAIName>(
  name: K,
  options?: CreateOptions<K> & CreateSessionOptions,
): Promise<Session<K> | null> {
  const namespace = getNamespace(name);
  if (!namespace) {
    return null;
  }

  const { progressKey, ...createOptions } = (options ??
    {}) as CreateOptions<K> & CreateSessionOptions;

  if ((await namespace.availability(createOptions)) === "unavailable") {
    return null;
  }

  try {
    return await namespace.create({
      ...createOptions,
      monitor: (monitor) =>
        monitor.addEventListener("downloadprogress", (event) => {
          if (progressKey) setDownloadProgress(progressKey, event.loaded);
        }),
    });
  } finally {
    if (progressKey) clearDownloadProgress(progressKey);
  }
}
