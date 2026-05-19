/**
 * Identifier of a built-in AI global namespace.
 *
 * Each value corresponds to a global object the browser exposes when its
 * matching API is enabled (`Translator`, `Rewriter`, `Proofreader`).
 *
 * @see https://developer.chrome.com/docs/ai/built-in
 */
export type BuiltInAIName = "Translator" | "Rewriter" | "Proofreader";

/**
 * Returns `true` when the global namespace for `name` is defined on this host.
 *
 * A capability check only — a `true` result does not guarantee the model can
 * run on this device. Combine with the hook's `status` (`"unavailable"`) for
 * the full readiness picture.
 *
 * @param name - Built-in AI namespace to probe.
 * @returns `true` when the matching global exists, `false` otherwise.
 *
 * @example
 * ```ts
 * if (!isSupported("Translator")) {
 *   return <FallbackUI />;
 * }
 * ```
 */
export function isSupported(name: BuiltInAIName): boolean {
  return (globalThis as Record<string, unknown>)[name] != null;
}
