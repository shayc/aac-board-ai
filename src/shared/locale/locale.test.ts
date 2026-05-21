import { describe, expect, test } from "vitest";
import { getLanguageCode, getTextDirection, normalizeLocale } from "./locale";

describe("normalizeLocale", () => {
  test.each([
    ["EN", "en"],
    ["fr", "fr"],
    ["en-us", "en-US"],
    ["pt_br", "pt-BR"],
    ["EN-gb", "en-GB"],
    ["zh-TW", "zh-TW"],
  ])("normalizes %s → %s", (input, expected) => {
    expect(normalizeLocale(input)).toBe(expected);
  });
});

describe("getLanguageCode", () => {
  test.each([
    ["en", "en"],
    ["en-US", "en"],
    ["pt_BR", "pt"],
    ["EN-GB", "en"],
  ])("extracts primary language from %s → %s", (input, expected) => {
    expect(getLanguageCode(input)).toBe(expected);
  });
});

describe("getTextDirection", () => {
  test.each([
    ["en", "ltr"],
    ["en-US", "ltr"],
    ["fr", "ltr"],
    ["zh-TW", "ltr"],
    ["ja", "ltr"],
  ])("returns ltr for LTR locale %s", (input, expected) => {
    expect(getTextDirection(input)).toBe(expected);
  });

  test.each([
    ["ar", "rtl"],
    ["he", "rtl"],
    ["fa", "rtl"],
    ["ur", "rtl"],
    ["ckb", "rtl"],
    ["sd", "rtl"],
    ["he-IL", "rtl"],
  ])("returns rtl for RTL locale %s", (input, expected) => {
    expect(getTextDirection(input)).toBe(expected);
  });

  test("falls back to ltr for unrecognized codes", () => {
    expect(getTextDirection("xx")).toBe("ltr");
  });

  test("falls back to ltr for invalid codes", () => {
    expect(getTextDirection("!!!")).toBe("ltr");
  });
});
