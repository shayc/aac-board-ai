import { beforeEach, describe, expect, test } from "vitest";
import {
  DEFAULT_LANGUAGE,
  getStoredLanguage,
  parseStoredLanguage,
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

describe("language store", () => {
  beforeEach(() => {
    setStoredLanguage(DEFAULT_LANGUAGE);
  });

  test("setStoredLanguage exposes the new value as the live snapshot", () => {
    setStoredLanguage("fr");

    expect(getStoredLanguage()).toBe("fr");
  });
});
