import { createInstance } from "../internal/create-instance.ts";
import type { ProofreaderOptions } from "./useProofreader.ts";

/**
 * Options for {@link createProofreader}. Mirrors {@link ProofreaderOptions} plus
 * an optional cancellation signal.
 */
export interface CreateProofreaderOptions extends ProofreaderOptions {
  /** Cancels both the (optional) download and `Proofreader.create()` call. */
  signal?: AbortSignal;
}

/**
 * Imperative `Proofreader` factory for call sites that decide options mid-flow
 * and can't drive a hook (e.g. queued passes, command palettes, one-shot scripts).
 *
 * Mirrors the hook lifecycle exactly:
 *
 * - Throws `UnsupportedError` when the `Proofreader` namespace is missing.
 * - Throws `UnavailableError` when `availability()` reports `"unavailable"`.
 * - Throws `NoUserActivationError` when a download is required without a
 *   transient user activation. Call from a click or keypress handler, or
 *   pre-warm the model via `useProofreader`.
 * - Reports download progress through the same store `useGlobalDownloadProgress`
 *   reads from, so a hook elsewhere in the tree can render a global indicator.
 *
 * The result is `AsyncDisposable`: prefer `await using` so the instance is
 * released when scope exits. `.destroy()` is still exposed for callers that
 * need to release the model earlier.
 *
 * @param options - Proofreader options and an optional `AbortSignal`.
 * @returns A `Proofreader` instance with `Symbol.asyncDispose` attached.
 *
 * @example
 * ```ts
 * async function proofread(text: string, signal: AbortSignal) {
 *   try {
 *     await using proofreader = await createProofreader({
 *       includeCorrectionTypes: true,
 *       signal,
 *     });
 *     return await proofreader.proofread(text);
 *   } catch (error) {
 *     if (error instanceof BuiltInAIError) {
 *       return null;
 *     }
 *     throw error;
 *   }
 * }
 * ```
 */
export async function createProofreader(
  options: CreateProofreaderOptions = {},
): Promise<Proofreader & AsyncDisposable> {
  const { signal, ...createOptions } = options;
  const instance = await createInstance<typeof createOptions, Proofreader>({
    name: "Proofreader",
    options: createOptions,
    signal,
  });
  const disposable = instance as Proofreader & Partial<AsyncDisposable>;
  disposable[Symbol.asyncDispose] ??= () =>
    Promise.resolve(disposable.destroy());
  return disposable as Proofreader & AsyncDisposable;
}
