import { useSyncExternalStore } from "react";
import type { BuiltInAIName } from "../../is-supported.ts";
import { snapshotProgressFor, subscribeProgress } from "./progress-store.ts";

/**
 * Highest in-flight download progress across built-in AI instances. Tracks
 * downloads started by hooks and by the imperative `create*` factories alike;
 * for per-instance progress, read `progress` from the hook return.
 *
 * @param namespace - Restrict aggregation to one API. Omit to aggregate
 * across every built-in AI download currently in flight.
 * @returns Progress in `[0, 1]`; `0` when nothing is downloading.
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
