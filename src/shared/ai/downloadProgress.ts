import { useSyncExternalStore } from "react";
import type { BuiltInAIName } from "./built-in-ai/spec";

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
 * Records download progress (`0..1`) for a built-in AI model. Use `subKey`
 * to distinguish concurrent downloads of the same API (e.g. different
 * language pairs for `Translator`). Passing `>= 1` clears the entry —
 * nothing is reported once a download completes.
 */
export function setDownloadProgress(
  name: BuiltInAIName,
  progress: number,
  subKey?: string,
): void {
  const key = subKey ? `${name}:${subKey}` : name;
  if (progress >= 1) {
    if (!progressByKey.delete(key)) return;
  } else {
    progressByKey.set(key, progress);
  }
  notify();
}

/**
 * Highest in-flight progress for `name`, aggregated across all sub-keys, as
 * a `0..1` fraction. Returns `0` when nothing is downloading.
 */
export function useDownloadProgress(name: BuiltInAIName): number {
  return useSyncExternalStore(subscribe, () => snapshotFor(name));
}

function snapshotFor(name: BuiltInAIName): number {
  const prefix = `${name}:`;
  let max = 0;
  for (const [key, progress] of progressByKey) {
    if (key !== name && !key.startsWith(prefix)) continue;
    if (progress > max) max = progress;
  }
  return max;
}
