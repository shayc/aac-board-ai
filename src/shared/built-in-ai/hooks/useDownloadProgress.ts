import { useSyncExternalStore } from "react";
import {
  snapshotProgressFor,
  subscribeProgress,
} from "../internal/progress-store.ts";

/** React subscription wrapper around {@link snapshotProgressFor}. */
export function useDownloadProgress(prefix: string): number {
  return useSyncExternalStore(subscribeProgress, () =>
    snapshotProgressFor(prefix),
  );
}
