import { describe, expect, test } from "vitest";
import {
  getEnglishLocaleName,
  getLanguageCode,
  getNativeLanguageName,
  getTextDirection,
  normalizeLocale,
} from "./locale";

describe("normalizeLocale", () => {
  test.each([
    ["EN", "en"],
    ["fr", "fr"],
    ["en-us", "en-US"],
    ["pt_br", "pt-BR"],
    ["EN-gb", "en-GB"],
    ["zh-TW", "zh-TW"],
    ["zh-hant", "zh-Hant"],
    ["zh-hant-cn", "zh-Hant-CN"],
  ])("normalizes %s → %s", (input, expected) => {
    expect(normalizeLocale(input)).toBe(expected);
  });

  test("strips Unicode -u- extensions via baseName", () => {
    expect(normalizeLocale("en-US-u-ca-hebrew")).toBe("en-US");
  });
});

describe("getLanguageCode", () => {
  test.each([
    ["en", "en"],
    ["en-US", "en"],
    ["pt_BR", "pt"],
    ["EN-GB", "en"],
    ["zh-Hant-CN", "zh"],
  ])("extracts primary language from %s → %s", (input, expected) => {
    expect(getLanguageCode(input)).toBe(expected);
  });
});

describe("getTextDirection", () => {
  test.each(["en", "zh-TW"])("returns ltr for %s", (input) => {
    expect(getTextDirection(input)).toBe("ltr");
  });

  test.each(["ar", "he", "fa", "ur", "ckb", "sd", "he-IL"])(
    "returns rtl for %s",
    (input) => {
      expect(getTextDirection(input)).toBe("rtl");
    },
  );

  test("returns ltr for well-formed but unknown codes (maximize finds no script)", () => {
    expect(getTextDirection("xx")).toBe("ltr");
  });

  test("returns ltr when Intl.Locale rejects structurally invalid input", () => {
    expect(getTextDirection("!!!")).toBe("ltr");
  });
});

describe("getEnglishLocaleName", () => {
  test("uses dialect form for region-qualified locales", () => {
    expect(getEnglishLocaleName("en-US")).toBe("American English");
  });

  test("returns plain language name when no region is given", () => {
    expect(getEnglishLocaleName("es")).toBe("Spanish");
  });
});

describe("getNativeLanguageName", () => {
  test("returns the endonym", () => {
    expect(getNativeLanguageName("fr")).toBe("français");
  });

  test("strips region before lookup", () => {
    expect(getNativeLanguageName("es-MX")).toBe("español");
  });
});
