import {
  baseLocale,
  getTextDirection,
  isLocale,
  type Locale,
  overwriteGetLocale,
  overwriteSetLocale,
} from "@paraglide/runtime";
import { useExternalStore } from "@shared/stores/external-store";
import { createPersistedStore } from "@shared/stores/persisted-store";
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

export function getCommunicationLanguage(): string {
  return languageStore.getSnapshot();
}

export function setCommunicationLanguage(language: string): void {
  languageStore.setState(language);
}

interface UseCommunicationLanguageReturn {
  language: string;
  direction: "ltr" | "rtl";
  setLanguage: (language: string) => void;
}

export function useCommunicationLanguage(): UseCommunicationLanguageReturn {
  const language = useExternalStore(languageStore);

  return {
    language,
    direction: getTextDirection(language),
    setLanguage: setCommunicationLanguage,
  };
}

export function getUILocale(): Locale {
  return resolveUILocale(getCommunicationLanguage());
}

export function useUILocale(): Locale {
  return resolveUILocale(useExternalStore(languageStore));
}

export function useUIDirection(): "ltr" | "rtl" {
  return getTextDirection(useUILocale());
}

overwriteGetLocale(getUILocale);
overwriteSetLocale(setCommunicationLanguage);
