import { describe, expect, test } from "vitest";
import {
  applyTranslations,
  collectTranslatablePhrases,
  findTranslations,
  getBoardSourceLanguage,
  findTranslatedBoard,
} from "./board-strings";
import type { Board } from "../types";

const mockStrings = {
  "es-ES": {
    "My Board": "Mi Tablero",
    Hello: "Hola",
    "Hello there": "Hola a todos",
  },
  "fr-CA": {
    Hello: "Bonjour",
  },
};

const mockBoard: Board = {
  id: "board-1",
  name: "My Board",
  grid: { columns: 2, rows: 1 },
  buttons: [
    {
      id: "btn-1",
      behavior: { kind: "compose" },
      label: "Hello",
      vocalization: "Hello there",
    },
    {
      id: "btn-2",
      behavior: { kind: "compose" },
      label: undefined,
      vocalization: undefined,
    },
  ],
  sourceLocale: "en-US",
  strings: mockStrings,
};

describe("board-strings", () => {
  test("getBoardSourceLanguage() extracts the base language code", () => {
    expect(getBoardSourceLanguage(mockBoard)).toBe("en");
    expect(
      getBoardSourceLanguage({ ...mockBoard, sourceLocale: undefined }),
    ).toBe("en");
    expect(
      getBoardSourceLanguage({ ...mockBoard, sourceLocale: "pt-BR" }),
    ).toBe("pt");
  });

  test("findTranslations() matches language codes correctly", () => {
    expect(findTranslations(mockBoard.strings, "es")).toEqual(
      mockStrings["es-ES"],
    );
    expect(findTranslations(mockBoard.strings, "fr")).toEqual(
      mockStrings["fr-CA"],
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

  test("collectTranslatablePhrases() extracts all unique UI text", () => {
    const phrases = collectTranslatablePhrases(mockBoard);

    expect(phrases.size).toBe(3);
    expect(phrases.has("My Board")).toBe(true);
    expect(phrases.has("Hello")).toBe(true);
    expect(phrases.has("Hello there")).toBe(true);
  });

  test("findTranslatedBoard() returns early if languages match", () => {
    expect(findTranslatedBoard(mockBoard, "en")).toBe(mockBoard);
  });

  test("findTranslatedBoard() returns translated board if cached strings exist", () => {
    const translated = findTranslatedBoard(mockBoard, "es");
    expect(translated).toBeDefined();
    expect(translated?.name).toBe("Mi Tablero");
    expect(translated?.buttons[0].label).toBe("Hola");
  });

  test("findTranslatedBoard() returns undefined if translations are missing", () => {
    expect(findTranslatedBoard(mockBoard, "de")).toBeUndefined();
  });
});
