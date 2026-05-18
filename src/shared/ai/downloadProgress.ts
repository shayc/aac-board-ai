import { useSyncExternalStore } from "react";

const progressByKey = new Map<string, number>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Records download progress (`0..1`) for `key`. Use a `<Namespace>` or
 * `<Namespace>:<params>` shape so `useDownloadProgress` can aggregate by
 * prefix.
 */
export function setDownloadProgress(key: string, progress: number): void {
  if (progressByKey.get(key) === progress) return;
  progressByKey.set(key, progress);
  notify();
}

/** Removes the entry for `key`. No-op when the key is absent. */
export function clearDownloadProgress(key: string): void {
  if (!progressByKey.delete(key)) return;
  notify();
}

/**
 * Highest in-flight progress (`0..1`) across keys matching `prefix` (exact,
 * or `${prefix}:…`). Returns `0` when nothing matches.
 */
export function useDownloadProgress(prefix: string): number {
  return useSyncExternalStore(subscribe, () => snapshotFor(prefix));
}

function snapshotFor(prefix: string): number {
  const sep = `${prefix}:`;
  let max = 0;
  for (const [key, progress] of progressByKey) {
    if (key !== prefix && !key.startsWith(sep)) continue;
    if (progress > max) max = progress;
  }
  return max;
}
