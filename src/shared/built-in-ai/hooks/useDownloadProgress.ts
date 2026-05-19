import { useSyncExternalStore } from "react";
import {
  snapshotProgressFor,
  subscribeProgress,
} from "../internal/progress-store.ts";

/**
 * Highest in-flight download progress (`0..1`) across keys matching `prefix`
 * (exact, or `${prefix}:…`). Returns `0` when nothing matches.
 */
export function useDownloadProgress(prefix: string): number {
  return useSyncExternalStore(subscribeProgress, () =>
    snapshotProgressFor(prefix),
  );
}
