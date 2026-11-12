import { describe, expect, test } from "vitest";
import { findStringTranslations } from "./find-string-translations";

const spanishTranslations = new Map([["Hello", "Hola"]]);
const frenchTranslations = new Map([["Hello", "Bonjour"]]);
const translationsByLocale = new Map([
  ["es-ES", spanishTranslations],
  ["fr-CA", frenchTranslations],
]);

describe("findStringTranslations", () => {
  test("matches regional translations by base language", () => {
    expect(findStringTranslations(translationsByLocale, "es")).toBe(
      spanishTranslations,
    );
    expect(findStringTranslations(translationsByLocale, "fr")).toBe(
      frenchTranslations,
    );
  });

  test("returns nothing for an untranslated language", () => {
    expect(findStringTranslations(translationsByLocale, "de")).toBeUndefined();
    expect(findStringTranslations(new Map(), "es")).toBeUndefined();
  });
});
