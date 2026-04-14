import { describe, expect, test } from "vitest";
import { normalizeLocaleCode } from "./locale";

describe("normalizeLocaleCode", () => {
  test("lowercases a language-only code", () => {
    expect(normalizeLocaleCode("EN")).toBe("en");
  });

  test("returns a language-only code as-is when already lowercase", () => {
    expect(normalizeLocaleCode("fr")).toBe("fr");
  });

  test("normalizes language-region with hyphen separator", () => {
    expect(normalizeLocaleCode("en-us")).toBe("en-US");
  });

  test("normalizes language-region with underscore separator", () => {
    expect(normalizeLocaleCode("pt_br")).toBe("pt-BR");
  });

  test("normalizes mixed-case language-region", () => {
    expect(normalizeLocaleCode("EN-gb")).toBe("en-GB");
  });

  test("handles already-normalized code", () => {
    expect(normalizeLocaleCode("zh-TW")).toBe("zh-TW");
  });
});
