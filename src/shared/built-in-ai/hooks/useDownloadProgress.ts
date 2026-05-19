import { useSyncExternalStore } from "react";
import {
  snapshotProgressFor,
  subscribeProgress,
} from "../internal/progress-store.ts";

/**
 * Subscribes to the highest in-flight download progress across every built-in
 * AI instance whose progress key matches `prefix`.
 *
 * Useful for rendering a global indicator that covers multiple concurrent
 * instances — e.g. passing `"Translator"` aggregates every language pair
 * currently downloading, regardless of which component initiated the download
 * (including {@link createTranslator}). A bare namespace name matches the
 * default key for that namespace; namespace + options match the JSON-encoded
 * variant.
 *
 * @param prefix - Progress key or prefix. A namespace name (e.g. `"Translator"`,
 *   `"Rewriter"`) aggregates every instance of that namespace.
 * @returns Highest progress value in `[0, 1]` among matching keys, or `0` when
 *   no download is in flight.
 *
 * @example
 * ```tsx
 * function GlobalDownloadBar() {
 *   const progress = useDownloadProgress("Translator");
 *   if (progress === 0) return null;
 *   return <ProgressBar value={progress} />;
 * }
 * ```
 */
export function useDownloadProgress(prefix: string): number {
  return useSyncExternalStore(subscribeProgress, () =>
    snapshotProgressFor(prefix),
  );
}
