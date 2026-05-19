import { useSyncExternalStore } from "react";
import type { BuiltInAIName } from "../../is-supported.ts";
import { snapshotProgressFor, subscribeProgress } from "./progress-store.ts";

/**
 * Subscribes to the highest in-flight download progress across built-in AI
 * instances.
 *
 * Useful for rendering a global indicator that covers concurrent instances —
 * e.g. a top-level "Translator downloading 73%" banner that lives outside any
 * specific `useTranslator` call site. Picks up downloads started imperatively
 * via `create*` factories as well as those started by hooks.
 *
 * For per-instance progress (the specific language pair the user is waiting
 * on), read `progress` from the hook return instead.
 *
 * @param namespace - When provided, restricts aggregation to that namespace
 *   (e.g. `"Translator"`). When omitted, aggregates across every built-in AI
 *   download currently in flight.
 * @returns Highest progress value in `[0, 1]` among matching downloads, or `0`
 *   when nothing is downloading.
 *
 * @example
 * ```tsx
 * function GlobalDownloadBar() {
 *   const progress = useGlobalDownloadProgress();
 *   if (progress === 0) return null;
 *   return <ProgressBar value={progress} />;
 * }
 * ```
 */
export function useGlobalDownloadProgress(namespace?: BuiltInAIName): number {
  return useSyncExternalStore(subscribeProgress, () =>
    snapshotProgressFor(namespace),
  );
}
