import { clearDownloadProgress, setDownloadProgress } from "./downloadProgress";

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

/** Options for `K.create()`, with the reserved `monitor` field omitted. */
export type CreateOptions<K extends BuiltInAIName> = Omit<
  NonNullable<Parameters<BuiltInAINamespaces[K]["create"]>[0]>,
  "monitor"
>;

/** Session instance produced by `K.create()`. */
export type Session<K extends BuiltInAIName> = Awaited<
  ReturnType<BuiltInAINamespaces[K]["create"]>
>;

/** Spec `Availability`, extended with `"unsupported"` for a missing global. */
export type AvailabilityStatus = "unsupported" | Availability;

export interface CreateSessionOptions {
  signal?: AbortSignal;
  /**
   * Key used to report download progress while `create()` runs. Cleared on
   * settle. See `setDownloadProgress` for the recommended key shape.
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

/** True when `name`'s global namespace exists. */
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

/** Resolves the model's availability. Returns `"unsupported"` when the global is missing. */
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
 * Creates a session, awaiting any model download. Returns `null` when the
 * model is `"unsupported"` or `"unavailable"`; other failures reject.
 */
export async function createSession<K extends BuiltInAIName>(
  name: K,
  options?: CreateOptions<K> & CreateSessionOptions,
): Promise<Session<K> | null> {
  const namespace = getNamespace(name);
  if (!namespace) {
    return null;
  }

  const { progressKey, ...rest } = (options ?? {}) as CreateOptions<K> &
    CreateSessionOptions;
  // TS can't narrow the omit back to `CreateOptions<K>` through a generic.
  const createOptions = rest as CreateOptions<K>;

  if ((await namespace.availability(createOptions)) === "unavailable") {
    return null;
  }

  try {
    return await namespace.create({
      ...createOptions,
      monitor: (monitor) =>
        monitor.addEventListener("downloadprogress", (event) => {
          if (progressKey) {
            setDownloadProgress(progressKey, event.loaded);
          }
        }),
    });
  } finally {
    if (progressKey) {
      clearDownloadProgress(progressKey);
    }
  }
}
