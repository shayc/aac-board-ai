export function readStoredPreferences(key: string): unknown {
  return JSON.parse(localStorage.getItem(key) ?? "null");
}
