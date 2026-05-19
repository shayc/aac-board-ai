import { createInstance } from "../internal/lifecycle/create-instance.ts";
import type { RewriterOptions } from "./useRewriter.ts";

/**
 * Options for {@link createRewriter}. Mirrors {@link RewriterOptions} plus an
 * optional cancellation signal.
 */
export interface CreateRewriterOptions extends RewriterOptions {
  /** Cancels both the (optional) download and `Rewriter.create()` call. */
  signal?: AbortSignal;
}

/**
 * Imperative `Rewriter` factory for call sites that decide options mid-flow and
 * can't drive a hook (e.g. queued rewrites, command palettes, one-shot scripts).
 *
 * Mirrors the hook lifecycle exactly:
 *
 * - Throws `UnsupportedError` when the `Rewriter` namespace is missing.
 * - Throws `UnavailableError` when `availability()` reports `"unavailable"`.
 * - Throws `NoUserActivationError` when a download is required without a
 *   transient user activation. Call from a click or keypress handler, or
 *   pre-warm the model via `useRewriter`.
 * - Reports download progress through the same store `useGlobalDownloadProgress`
 *   reads from, so a hook elsewhere in the tree can render a global indicator.
 *
 * The result is `AsyncDisposable`: prefer `await using` so the instance is
 * released when scope exits. `.destroy()` is still exposed for callers that
 * need to release the model earlier.
 *
 * @param options - Rewriter options and an optional `AbortSignal`.
 * @returns A `Rewriter` instance with `Symbol.asyncDispose` attached.
 *
 * @example
 * ```ts
 * async function rephrase(text: string, signal: AbortSignal) {
 *   try {
 *     await using rewriter = await createRewriter({
 *       tone: "more-formal",
 *       signal,
 *     });
 *     return await rewriter.rewrite(text);
 *   } catch (error) {
 *     if (error instanceof BuiltInAIError) {
 *       return null;
 *     }
 *     throw error;
 *   }
 * }
 * ```
 */
export async function createRewriter(
  options: CreateRewriterOptions = {},
): Promise<Rewriter & AsyncDisposable> {
  const { signal, ...createOptions } = options;
  const instance = await createInstance<typeof createOptions, Rewriter>({
    name: "Rewriter",
    options: createOptions,
    signal,
  });
  const disposable = instance as Rewriter & Partial<AsyncDisposable>;
  disposable[Symbol.asyncDispose] ??= () =>
    Promise.resolve(disposable.destroy());
  return disposable as Rewriter & AsyncDisposable;
}
