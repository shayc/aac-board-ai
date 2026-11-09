import {
  baseLocale,
  isLocale,
  overwriteGetLocale,
  overwriteSetLocale,
  type Locale,
} from "@paraglide/runtime";
import { useExternalStore } from "@shared/state/external-store";
import { createPersistedStore } from "@shared/state/persisted-store";
import { getLanguageCode } from "./locale";

const LANGUAGE_STORAGE_KEY = "language";
export const DEFAULT_LANGUAGE = baseLocale;

export function getPreferredLanguage(
  languages: readonly string[] = navigator.languages,
): string {
  return languages.map(getLanguageCode).find(isLocale) ?? DEFAULT_LANGUAGE;
}

export function parseStoredLanguage(raw: unknown): string {
  return typeof raw === "string" && raw !== "" ? raw : getPreferredLanguage();
}

const languageStore = createPersistedStore<string>(
  LANGUAGE_STORAGE_KEY,
  parseStoredLanguage,
);

export function resolveUILocale(language: string): Locale {
  return isLocale(language) ? language : baseLocale;
}

export function getStoredLanguage(): string {
  return languageStore.getSnapshot();
}

export function setStoredLanguage(language: string): void {
  languageStore.setState(language);
}

export function useStoredLanguage(): string {
  return useExternalStore(languageStore);
}

export function getUILocale(): Locale {
  return resolveUILocale(getStoredLanguage());
}

export function useUILocale(): Locale {
  return resolveUILocale(useStoredLanguage());
}

// The communication language store is the app's locale authority. Paraglide
// delegates to it so message functions and React always observe one snapshot.
overwriteGetLocale(getUILocale);
overwriteSetLocale((locale) => setStoredLanguage(locale));
