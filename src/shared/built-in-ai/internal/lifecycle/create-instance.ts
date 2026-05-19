import {
  NoUserActivationError,
  UnavailableError,
  UnsupportedError,
} from "../../errors.ts";
import {
  buildProgressKey,
  clearDownloadProgress,
  setDownloadProgress,
} from "../progress-store.ts";
import type { AINamespace, DestroyableInstance } from "./types.ts";

function hasUserActivation(): boolean {
  return navigator.userActivation?.isActive ?? false;
}

export interface CreateInstanceOptions<O extends object> {
  /** Built-in AI global namespace name (`"Translator"`, `"Rewriter"`, …). */
  name: string;
  /** Browser `create()` options, forwarded verbatim. */
  options: O | undefined;
  /** Cancels both the (optional) download and `namespace.create()`. */
  signal?: AbortSignal;
  /** Called on each `downloadprogress` event with `event.loaded` in `[0, 1]`. */
  onProgress?: (loaded: number) => void;
}

/**
 * The shared "namespace lookup → availability → activation → create with
 * progress wiring → cleanup" path used by every built-in AI entry point.
 *
 * Throws the library's typed lifecycle errors and writes to the shared
 * progress store on the caller's behalf. Never resolves with a partial
 * instance — on rejection the store is cleared in `finally`. The returned
 * instance is `AsyncDisposable`; the wrap is a no-op if the underlying
 * instance already implements `[Symbol.asyncDispose]`.
 *
 * @internal
 */
export async function createInstance<
  O extends object,
  I extends DestroyableInstance,
>(params: CreateInstanceOptions<O>): Promise<I & AsyncDisposable> {
  const { name, options, signal, onProgress } = params;

  const namespace = (globalThis as Record<string, unknown>)[name] as
    | AINamespace<O, I>
    | undefined;
  if (!namespace) {
    throw new UnsupportedError();
  }

  const availability = await namespace.availability(options);
  if (availability === "unavailable") {
    throw new UnavailableError();
  }

  const willDownload = availability !== "available";
  if (willDownload && !hasUserActivation()) {
    throw new NoUserActivationError();
  }

  const key = willDownload ? buildProgressKey(name, options) : null;
  try {
    if (key) {
      setDownloadProgress(key, 0);
    }
    const instance = await namespace.create({
      ...options!,
      signal,
      monitor: willDownload
        ? (monitor) =>
            monitor.addEventListener("downloadprogress", (event) => {
              onProgress?.(event.loaded);
              if (key) {
                setDownloadProgress(key, event.loaded);
              }
            })
        : undefined,
    });
    const disposable = instance as I & Partial<AsyncDisposable>;
    disposable[Symbol.asyncDispose] ??= () =>
      Promise.resolve(disposable.destroy?.());
    return disposable as I & AsyncDisposable;
  } finally {
    if (key) {
      clearDownloadProgress(key);
    }
  }
}
