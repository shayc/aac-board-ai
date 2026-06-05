export const LANGUAGE_STORAGE_KEY = "language";
export const DEFAULT_LANGUAGE = "en";

export function getStoredLanguage(): string {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);

    return stored ? (JSON.parse(stored) as string) : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}
