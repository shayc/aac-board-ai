import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  DEFAULT_LANGUAGE,
  getPreferredLanguage,
  getUILocale,
  parseStoredLanguage,
  resolveUILocale,
  setStoredLanguage,
} from "./language-store";

describe("parseStoredLanguage", () => {
  test("passes a non-empty string through unchanged", () => {
    expect(parseStoredLanguage("he")).toBe("he");
  });

  test("falls back to the preferred browser language for a non-string value", () => {
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["fr-CA"]);

    expect(parseStoredLanguage({ not: "a string" })).toBe("fr");
    expect(parseStoredLanguage(undefined)).toBe("fr");
    expect(parseStoredLanguage(42)).toBe("fr");
  });

  test("falls back to the preferred browser language for an empty string", () => {
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["fr-CA"]);

    expect(parseStoredLanguage("")).toBe("fr");
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

  test("derives a translated UI locale from the communication language", () => {
    expect(resolveUILocale("he")).toBe("he");
    expect(resolveUILocale("ca")).toBe(DEFAULT_LANGUAGE);

    setStoredLanguage("bn");
    expect(getUILocale()).toBe("bn");
  });
});
