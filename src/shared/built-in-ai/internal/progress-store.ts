const progressByKey = new Map<string, number>();
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeProgress(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setDownloadProgress(key: string, progress: number): void {
  if (progressByKey.get(key) === progress) {
    return;
  }
  progressByKey.set(key, progress);
  notify();
}

export function clearDownloadProgress(key: string): void {
  if (!progressByKey.delete(key)) {
    return;
  }
  notify();
}

export function snapshotProgressFor(prefix: string | undefined): number {
  const sep = prefix === undefined ? undefined : `${prefix}:`;
  let max = 0;
  for (const [key, progress] of progressByKey) {
    if (sep !== undefined && key !== prefix && !key.startsWith(sep)) {
      continue;
    }
    if (progress > max) {
      max = progress;
    }
  }
  return max;
}

/**
 * Stable progress-store key for an instance distinguished by `options`. Keys
 * are sorted before JSON encoding so insertion order doesn't shard the same
 * logical options into separate entries.
 */
export function buildProgressKey(
  globalName: string,
  options: object | undefined,
): string {
  if (!options) {
    return globalName;
  }
  const keys = Object.keys(options).sort();
  if (keys.length === 0) {
    return globalName;
  }
  const ordered = Object.fromEntries(
    keys.map((k) => [k, (options as Record<string, unknown>)[k]]),
  );
  return `${globalName}:${JSON.stringify(ordered)}`;
}
