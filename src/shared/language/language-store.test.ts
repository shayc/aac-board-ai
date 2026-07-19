import { beforeEach, describe, expect, test } from "vitest";
import {
  DEFAULT_LANGUAGE,
  getPreferredLanguage,
  getStoredLanguage,
  getUiLocale,
  parseStoredLanguage,
  resolveUiLocale,
  setStoredLanguage,
} from "./language-store";

describe("parseStoredLanguage", () => {
  test("passes a non-empty string through unchanged", () => {
    expect(parseStoredLanguage("he")).toBe("he");
  });

  test("falls back to the default for a non-string value", () => {
    expect(parseStoredLanguage({ not: "a string" })).toBe(DEFAULT_LANGUAGE);
    expect(parseStoredLanguage(undefined)).toBe(DEFAULT_LANGUAGE);
    expect(parseStoredLanguage(42)).toBe(DEFAULT_LANGUAGE);
  });

  test("falls back to the default for an empty string", () => {
    expect(parseStoredLanguage("")).toBe(DEFAULT_LANGUAGE);
  });
});

describe("getPreferredLanguage", () => {
  test("uses the first browser language with an app translation", () => {
    expect(getPreferredLanguage(["ca-ES", "fr-CA", "he-IL"])).toBe("fr");
  });

  test("falls back to English when no browser language is translated", () => {
    expect(getPreferredLanguage(["ca-ES", "ms-MY"])).toBe(DEFAULT_LANGUAGE);
  });
});

describe("language store", () => {
  beforeEach(() => {
    setStoredLanguage(DEFAULT_LANGUAGE);
  });

  test("setStoredLanguage exposes the new value as the live snapshot", () => {
    setStoredLanguage("fr");

    expect(getStoredLanguage()).toBe("fr");
  });

  test("derives a translated UI locale from the communication language", () => {
    expect(resolveUiLocale("he")).toBe("he");
    expect(resolveUiLocale("ca")).toBe(DEFAULT_LANGUAGE);

    setStoredLanguage("bn");
    expect(getUiLocale()).toBe("bn");
  });
});
