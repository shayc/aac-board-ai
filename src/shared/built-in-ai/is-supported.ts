/**
 * A built-in AI global the browser exposes when the matching API is enabled.
 *
 * @see https://developer.chrome.com/docs/ai/built-in
 */
export type BuiltInAIName = "Translator" | "Rewriter" | "Proofreader";

/**
 * Feature-detects a built-in AI namespace. A `true` result means the global
 * exists, not that the model can actually run — combine with the hook's
 * `status` (`"unavailable"`) for the full readiness picture.
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
