import { describe, expect, test } from "vitest";
import {
  applyTranslations,
  collectTranslatableStrings,
  findTranslations,
  getBoardLanguage,
  resolveSyncTranslation,
} from "./board-translation-core";
import type { Board } from "../types";

const mockBoard: Board = {
  id: "board-1",
  name: "My Board",
  grid: { columns: 2, rows: 1 },
  buttons: [
    {
      id: "btn-1",
      label: "Hello",
      vocalization: "Hello there",
    },
    {
      id: "btn-2",
      label: undefined,
      vocalization: undefined,
    },
  ],
  locale: "en-US",
  strings: {
    "es-ES": {
      "My Board": "Mi Tablero",
      Hello: "Hola",
      "Hello there": "Hola a todos",
    },
    "fr-CA": {
      Hello: "Bonjour",
    },
  },
};

describe("board-translation-core", () => {
  test("getBoardLanguage() extracts the base language code", () => {
    expect(getBoardLanguage(mockBoard)).toBe("en");
    expect(getBoardLanguage({ ...mockBoard, locale: undefined })).toBe("en");
    expect(getBoardLanguage({ ...mockBoard, locale: "pt-BR" })).toBe("pt");
  });

  test("findTranslations() matches language codes correctly", () => {
    expect(findTranslations(mockBoard.strings, "es")).toEqual(
      mockBoard.strings!["es-ES"],
    );
    expect(findTranslations(mockBoard.strings, "fr")).toEqual(
      mockBoard.strings!["fr-CA"],
    );
    expect(findTranslations(mockBoard.strings, "de")).toBeUndefined();
    expect(findTranslations(undefined, "es")).toBeUndefined();
  });

  test("applyTranslations() maps string record onto board structure", () => {
    const translations = {
      "My Board": "Mi Tablero",
      Hello: "Hola",
    };
    const translated = applyTranslations(mockBoard, translations);

    expect(translated.name).toBe("Mi Tablero");
    expect(translated.buttons[0].label).toBe("Hola");
    expect(translated.buttons[0].vocalization).toBe("Hello there");
    expect(translated.buttons[1].label).toBeUndefined();
  });

  test("collectTranslatableStrings() extracts all unique UI text", () => {
    const strings = collectTranslatableStrings(mockBoard);

    expect(strings.size).toBe(3);
    expect(strings.has("My Board")).toBe(true);
    expect(strings.has("Hello")).toBe(true);
    expect(strings.has("Hello there")).toBe(true);
  });

  test("resolveSyncTranslation() returns early if languages match", () => {
    expect(resolveSyncTranslation(mockBoard, "en")).toBe(mockBoard);
  });

  test("resolveSyncTranslation() returns translated board if cached strings exist", () => {
    const translated = resolveSyncTranslation(mockBoard, "es");
    expect(translated).toBeDefined();
    expect(translated?.name).toBe("Mi Tablero");
    expect(translated?.buttons[0].label).toBe("Hola");
  });

  test("resolveSyncTranslation() returns undefined if translations are missing", () => {
    expect(resolveSyncTranslation(mockBoard, "de")).toBeUndefined();
  });
});
