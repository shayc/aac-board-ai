import { describe, expect, test } from "vitest";
import {
  getLanguageDirection,
  getPrimaryLanguage,
  normalizeLocaleCode,
} from "./locale";

describe("normalizeLocaleCode", () => {
  test.each([
    ["EN", "en"],
    ["fr", "fr"],
    ["en-us", "en-US"],
    ["pt_br", "pt-BR"],
    ["EN-gb", "en-GB"],
    ["zh-TW", "zh-TW"],
  ])("normalizes %s → %s", (input, expected) => {
    expect(normalizeLocaleCode(input)).toBe(expected);
  });
});

describe("getPrimaryLanguage", () => {
  test.each([
    ["en", "en"],
    ["en-US", "en"],
    ["pt_BR", "pt"],
    ["EN-GB", "en"],
  ])("extracts primary language from %s → %s", (input, expected) => {
    expect(getPrimaryLanguage(input)).toBe(expected);
  });
});

describe("getLanguageDirection", () => {
  test.each([
    ["en", "ltr"],
    ["en-US", "ltr"],
    ["fr", "ltr"],
    ["zh-TW", "ltr"],
    ["ja", "ltr"],
  ])("returns ltr for LTR locale %s", (input, expected) => {
    expect(getLanguageDirection(input)).toBe(expected);
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
    expect(getLanguageDirection(input)).toBe(expected);
  });

  test("falls back to ltr for unrecognized codes", () => {
    expect(getLanguageDirection("xx")).toBe("ltr");
  });

  test("falls back to ltr for invalid codes", () => {
    expect(getLanguageDirection("!!!")).toBe("ltr");
  });
});
