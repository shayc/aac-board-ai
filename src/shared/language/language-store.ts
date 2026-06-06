import { createPersistedStore } from "@shared/utils/persisted-store";
import { useSyncExternalStore } from "react";

const LANGUAGE_STORAGE_KEY = "language";
export const DEFAULT_LANGUAGE = "en";

export function parseStoredLanguage(raw: unknown): string {
  return typeof raw === "string" && raw !== "" ? raw : DEFAULT_LANGUAGE;
}

const store = createPersistedStore<string>(
  LANGUAGE_STORAGE_KEY,
  parseStoredLanguage,
);

export function getStoredLanguage(): string {
  return store.getSnapshot();
}

export function setStoredLanguage(language: string): void {
  store.setState(language);
}

export function useStoredLanguage(): string {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
