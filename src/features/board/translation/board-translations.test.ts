import { describe, expect, test } from "vitest";
import {
  applyTranslations,
  collectTranslatablePhrases,
  findTranslations,
  getBoardLanguage,
  findTranslatedBoard,
} from "./board-translations";
import type { Board } from "../board-types";

const mockTranslations = {
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
      label: "Hello",
      vocalization: "Hello there",
      actions: [],
    },
    {
      id: "btn-2",
      label: "",
      vocalization: undefined,
      actions: [],
    },
  ],
  locale: "en-US",
  translations: mockTranslations,
};

describe("board-translations", () => {
  test("getBoardLanguage() extracts the base language code", () => {
    expect(getBoardLanguage(mockBoard)).toBe("en");
    expect(getBoardLanguage({ ...mockBoard, locale: undefined })).toBe("en");
    expect(getBoardLanguage({ ...mockBoard, locale: "pt-BR" })).toBe("pt");
  });

  test("findTranslations() matches language codes correctly", () => {
    expect(findTranslations(mockBoard.translations, "es")).toEqual(
      mockTranslations["es-ES"],
    );
    expect(findTranslations(mockBoard.translations, "fr")).toEqual(
      mockTranslations["fr-CA"],
    );
    expect(findTranslations(mockBoard.translations, "de")).toBeUndefined();
    expect(findTranslations(undefined, "es")).toBeUndefined();
  });

  test("applyTranslations() maps translations onto board structure", () => {
    const translations = {
      "My Board": "Mi Tablero",
      Hello: "Hola",
    };
    const translated = applyTranslations(mockBoard, translations);

    expect(translated.name).toBe("Mi Tablero");
    expect(translated.buttons[0].label).toBe("Hola");
    expect(translated.buttons[0].vocalization).toBe("Hello there");
    expect(translated.buttons[1].label).toBe("");
  });

  test.each(["", " \t\n\u00a0 "])(
    "applyTranslations() normalizes blank translated board text %j",
    (text) => {
      const translated = applyTranslations(mockBoard, {
        "My Board": text,
        Hello: text,
        "Hello there": text,
      });

      expect(translated.name).toBeUndefined();
      expect(translated.buttons[0].label).toBe("");
      expect(translated.buttons[0].vocalization).toBeUndefined();
    },
  );

  test("applyTranslations() preserves exact source keys and nonblank translated text", () => {
    const board: Board = {
      ...mockBoard,
      name: " My Board ",
      buttons: [
        {
          id: "btn-1",
          label: " Hello ",
          vocalization: "\tHello there\n",
          actions: [],
        },
      ],
    };

    const translated = applyTranslations(board, {
      " My Board ": " Mi Tablero ",
      " Hello ": " Hola ",
      "\tHello there\n": "\tHola a todos\n",
    });

    expect(translated.name).toBe(" Mi Tablero ");
    expect(translated.buttons[0].label).toBe(" Hola ");
    expect(translated.buttons[0].vocalization).toBe("\tHola a todos\n");
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

  test("findTranslatedBoard() returns translated board if cached translations exist", () => {
    const translated = findTranslatedBoard(mockBoard, "es");
    expect(translated).toBeDefined();
    expect(translated?.name).toBe("Mi Tablero");
    expect(translated?.buttons[0].label).toBe("Hola");
  });

  test("findTranslatedBoard() returns undefined if translations are missing", () => {
    expect(findTranslatedBoard(mockBoard, "de")).toBeUndefined();
  });
});
