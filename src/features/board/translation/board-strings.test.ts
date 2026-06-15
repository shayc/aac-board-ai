import { describe, expect, test } from "vitest";
import {
  applyTranslations,
  collectTranslatableStrings,
  findTranslations,
  getBoardLanguage,
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
  description: "A starter board",
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
  strings: mockStrings,
};

describe("board-strings", () => {
  test("getBoardLanguage() extracts the base language code", () => {
    expect(getBoardLanguage(mockBoard)).toBe("en");
    expect(getBoardLanguage({ ...mockBoard, locale: undefined })).toBe("en");
    expect(getBoardLanguage({ ...mockBoard, locale: "pt-BR" })).toBe("pt");
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
      "A starter board": "Un tablero inicial",
      Hello: "Hola",
    };
    const translated = applyTranslations(mockBoard, translations);

    expect(translated.name).toBe("Mi Tablero");
    expect(translated.description).toBe("Un tablero inicial");
    expect(translated.buttons[0].label).toBe("Hola");
    expect(translated.buttons[0].vocalization).toBe("Hello there");
    expect(translated.buttons[1].label).toBeUndefined();
  });

  test("collectTranslatableStrings() extracts all unique UI text", () => {
    const strings = collectTranslatableStrings(mockBoard);

    expect(strings.size).toBe(4);
    expect(strings.has("My Board")).toBe(true);
    expect(strings.has("A starter board")).toBe(true);
    expect(strings.has("Hello")).toBe(true);
    expect(strings.has("Hello there")).toBe(true);
  });
});
