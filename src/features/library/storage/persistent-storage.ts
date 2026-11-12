/**
 * Asks the browser to keep stored boards when the device runs low on space.
 * Browsers may evict IndexedDB otherwise. Some ask the user first, so the
 * request can stay pending long after the caller has moved on.
 */
export async function requestPersistentStorage(): Promise<void> {
  try {
    await navigator.storage.persist();
  } catch {
    // Insecure contexts have no storage manager; boards stay best-effort there.
  }
}
