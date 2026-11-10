import { describe, expect, test } from "vitest";
import {
  getLanguageCode,
  getNativeLanguageName,
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
  ])("normalizes %j to %j", (input, expected) => {
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
  ])("extracts the primary language of %j as %j", (input, expected) => {
    expect(getLanguageCode(input)).toBe(expected);
  });
});

describe("getNativeLanguageName", () => {
  test("returns the endonym", () => {
    expect(getNativeLanguageName("fr")).toBe("français");
  });

  test("strips region before lookup", () => {
    expect(getNativeLanguageName("es-MX")).toBe(getNativeLanguageName("es"));
  });
});
