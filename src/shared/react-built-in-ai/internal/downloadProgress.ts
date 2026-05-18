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
 * Records download progress (`0..1`) for `key`. Internal: the lifecycle store
 * and `createTranslator` write here; consumers read via `useDownloadProgress`.
 * Use a `<Namespace>` or `<Namespace>:<params>` key shape so prefix
 * aggregation works.
 */
export function setDownloadProgress(key: string, progress: number): void {
  if (progressByKey.get(key) === progress) {
    return;
  }
  progressByKey.set(key, progress);
  notify();
}

/** Removes the entry for `key`. No-op when the key is absent. */
export function clearDownloadProgress(key: string): void {
  if (!progressByKey.delete(key)) {
    return;
  }
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
    if (key !== prefix && !key.startsWith(sep)) {
      continue;
    }
    if (progress > max) {
      max = progress;
    }
  }
  return max;
}

/**
 * Stable key for an instance distinguished by `options`. Empty/undefined
 * options collapse to just the namespace name; otherwise the JSON-stringified
 * options are appended so concurrent instances with different options don't
 * overwrite each other.
 */
export function buildProgressKey(
  globalName: string,
  options: object | undefined,
): string {
  if (!options || Object.keys(options).length === 0) {
    return globalName;
  }
  return `${globalName}:${JSON.stringify(options)}`;
}
