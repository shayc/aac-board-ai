import {
  baseLocale,
  isLocale,
  overwriteGetLocale,
  overwriteSetLocale,
  type Locale,
} from "@paraglide/runtime";
import { getLanguageCode } from "@shared/utils/locale";
import { createPersistedStore } from "@shared/utils/persisted-store";
import { useSyncExternalStore } from "react";

const LANGUAGE_STORAGE_KEY = "language";
export const DEFAULT_LANGUAGE = baseLocale;

export function getPreferredLanguage(
  languages: readonly string[] = globalThis.navigator?.languages ?? [],
): string {
  for (const locale of languages) {
    const language = getLanguageCode(locale);
    if (isLocale(language)) {
      return language;
    }
  }

  return DEFAULT_LANGUAGE;
}

export function parseStoredLanguage(raw: unknown): string {
  return typeof raw === "string" && raw !== "" ? raw : getPreferredLanguage();
}

const store = createPersistedStore<string>(
  LANGUAGE_STORAGE_KEY,
  parseStoredLanguage,
);

export function resolveUiLocale(language: string): Locale {
  return isLocale(language) ? language : baseLocale;
}

export function getStoredLanguage(): string {
  return store.getSnapshot();
}

export function setStoredLanguage(language: string): void {
  store.setState(language);
}

export function useStoredLanguage(): string {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

export function getUiLocale(): Locale {
  return resolveUiLocale(getStoredLanguage());
}

export function useUiLocale(): Locale {
  return resolveUiLocale(useStoredLanguage());
}

// The communication language store is the app's locale authority. Paraglide
// delegates to it so message functions and React always observe one snapshot.
overwriteGetLocale(getUiLocale);
overwriteSetLocale((locale) => setStoredLanguage(locale));
