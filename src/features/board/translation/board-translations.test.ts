import { describe, expect, test } from "vitest";
import {
  applyTranslations,
  collectTranslatablePhrases,
  findPhraseTranslations,
  getBoardLanguage,
  findCachedTranslation,
} from "./board-translations";
import type { Board } from "../board-types";

const mockTranslationsByLocale = {
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
  translationsByLocale: mockTranslationsByLocale,
};

describe("getBoardLanguage", () => {
  test("returns the base language of the board locale, defaulting to English", () => {
    expect(getBoardLanguage(mockBoard)).toBe("en");
    expect(getBoardLanguage({ ...mockBoard, locale: undefined })).toBe("en");
    expect(getBoardLanguage({ ...mockBoard, locale: "pt-BR" })).toBe("pt");
  });
});

describe("findPhraseTranslations", () => {
  test("matches regional translations by base language", () => {
    expect(
      findPhraseTranslations(mockBoard.translationsByLocale, "es"),
    ).toEqual(mockTranslationsByLocale["es-ES"]);
    expect(
      findPhraseTranslations(mockBoard.translationsByLocale, "fr"),
    ).toEqual(mockTranslationsByLocale["fr-CA"]);
  });

  test("returns nothing for an untranslated language", () => {
    expect(
      findPhraseTranslations(mockBoard.translationsByLocale, "de"),
    ).toBeUndefined();
    expect(findPhraseTranslations({}, "es")).toBeUndefined();
  });
});

describe("applyTranslations", () => {
  test("translates the board name and labels, leaving untranslated text unchanged", () => {
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
    "clears text whose translation is blank (%j)",
    (text) => {
      const translated = applyTranslations(mockBoard, {
        "My Board": text,
        Hello: text,
        "Hello there": text,
      });

      expect(translated.name).toBe("");
      expect(translated.buttons[0].label).toBe("");
      expect(translated.buttons[0].vocalization).toBeUndefined();
    },
  );

  test("matches source text exactly and keeps translated whitespace", () => {
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
});

describe("collectTranslatablePhrases", () => {
  test("collects each unique nonblank name, label, and vocalization", () => {
    const phrases = collectTranslatablePhrases(mockBoard);

    expect(phrases.size).toBe(3);
    expect(phrases.has("My Board")).toBe(true);
    expect(phrases.has("Hello")).toBe(true);
    expect(phrases.has("Hello there")).toBe(true);
  });
});

describe("findCachedTranslation", () => {
  test("returns the board itself when its language matches", () => {
    expect(findCachedTranslation(mockBoard, "en")).toBe(mockBoard);
  });

  test("returns a translated board from cached translations", () => {
    const translated = findCachedTranslation(mockBoard, "es");
    expect(translated).toBeDefined();
    expect(translated?.name).toBe("Mi Tablero");
    expect(translated?.buttons[0].label).toBe("Hola");
  });

  test("returns nothing when the language has no cached translations", () => {
    expect(findCachedTranslation(mockBoard, "de")).toBeUndefined();
  });
});
