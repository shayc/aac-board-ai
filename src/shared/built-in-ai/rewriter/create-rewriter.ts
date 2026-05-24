import { createInstance } from "../internal/lifecycle/create-instance";
import type { RewriterOptions } from "./use-rewriter";

/**
 * Options for {@link createRewriter}. Mirrors {@link RewriterOptions} plus an
 * optional cancellation signal.
 */
export interface CreateRewriterOptions extends RewriterOptions {
  /** Cancels both the (optional) download and `Rewriter.create()` call. */
  signal?: AbortSignal;
}

/**
 * Imperative `Rewriter` factory. Mirrors the {@link useRewriter} lifecycle for
 * call sites that decide options mid-flow and can't render a hook (queued
 * rewrites, command palettes, one-shot scripts).
 *
 * Throws {@link UnsupportedError}, {@link UnavailableError}, or
 * {@link NoUserActivationError} — call from a user-activation handler when a
 * download may be required, or pre-warm via {@link useRewriter}. The returned
 * instance is `AsyncDisposable`; prefer `await using` to release on scope exit.
 *
 * @example
 * ```ts
 * await using rewriter = await createRewriter({ tone: "more-formal", signal });
 * return await rewriter.rewrite(text);
 * ```
 */
export async function createRewriter(
  options: CreateRewriterOptions = {},
): Promise<Rewriter & AsyncDisposable> {
  const { signal, ...createOptions } = options;
  return createInstance<typeof createOptions, Rewriter>({
    name: "Rewriter",
    options: createOptions,
    signal,
  });
}
