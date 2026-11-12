import type { Board } from "@shared/board/board-types";
import { describe, expect, test } from "vitest";
import {
  applyTranslations,
  collectBoardStrings,
  findBoardInLanguage,
  findStringTranslations,
  getSourceLanguage,
} from "./board-translations";

const spanishTranslations = new Map([
  ["My Board", "Mi Tablero"],
  ["Hello", "Hola"],
  ["Hello there", "Hola a todos"],
]);
const frenchTranslations = new Map([["Hello", "Bonjour"]]);

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
  translationsByLocale: new Map([
    ["es-ES", spanishTranslations],
    ["fr-CA", frenchTranslations],
  ]),
};

describe("getSourceLanguage", () => {
  test("returns the base language of the board locale, defaulting to English", () => {
    expect(getSourceLanguage(mockBoard)).toBe("en");
    expect(getSourceLanguage({ ...mockBoard, locale: undefined })).toBe("en");
    expect(getSourceLanguage({ ...mockBoard, locale: "pt-BR" })).toBe("pt");
  });
});

describe("findStringTranslations", () => {
  test("matches regional translations by base language", () => {
    expect(findStringTranslations(mockBoard.translationsByLocale, "es")).toBe(
      spanishTranslations,
    );
    expect(findStringTranslations(mockBoard.translationsByLocale, "fr")).toBe(
      frenchTranslations,
    );
  });

  test("returns nothing for an untranslated language", () => {
    expect(
      findStringTranslations(mockBoard.translationsByLocale, "de"),
    ).toBeUndefined();
    expect(findStringTranslations(new Map(), "es")).toBeUndefined();
  });
});

describe("applyTranslations", () => {
  test("translates the board name and labels, leaving untranslated text unchanged", () => {
    const translations = new Map([
      ["My Board", "Mi Tablero"],
      ["Hello", "Hola"],
    ]);
    const translated = applyTranslations(mockBoard, translations);

    expect(translated.name).toBe("Mi Tablero");
    expect(translated.buttons[0]?.label).toBe("Hola");
    expect(translated.buttons[0]?.vocalization).toBe("Hello there");
    expect(translated.buttons[1]?.label).toBe("");
  });

  test.each(["", " \t\n\u00a0 "])(
    "clears text whose translation is blank (%j)",
    (text) => {
      const translated = applyTranslations(
        mockBoard,
        new Map([
          ["My Board", text],
          ["Hello", text],
          ["Hello there", text],
        ]),
      );

      expect(translated.name).toBe("");
      expect(translated.buttons[0]?.label).toBe("");
      expect(translated.buttons[0]?.vocalization).toBeUndefined();
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

    const translated = applyTranslations(
      board,
      new Map([
        [" My Board ", " Mi Tablero "],
        [" Hello ", " Hola "],
        ["\tHello there\n", "\tHola a todos\n"],
      ]),
    );

    expect(translated.name).toBe(" Mi Tablero ");
    expect(translated.buttons[0]?.label).toBe(" Hola ");
    expect(translated.buttons[0]?.vocalization).toBe("\tHola a todos\n");
  });
});

describe("collectBoardStrings", () => {
  test("collects each unique nonblank name, label, and vocalization", () => {
    const strings = collectBoardStrings(mockBoard);

    expect(strings.size).toBe(3);
    expect(strings.has("My Board")).toBe(true);
    expect(strings.has("Hello")).toBe(true);
    expect(strings.has("Hello there")).toBe(true);
  });
});

describe("findBoardInLanguage", () => {
  test("returns the board itself when its language matches", () => {
    expect(findBoardInLanguage(mockBoard, "en")).toBe(mockBoard);
  });

  test("returns a translated board from the board's own translations", () => {
    const translated = findBoardInLanguage(mockBoard, "es");
    expect(translated).toBeDefined();
    expect(translated?.name).toBe("Mi Tablero");
    expect(translated?.buttons[0]?.label).toBe("Hola");
  });

  test("returns nothing when the board has no translations for the language", () => {
    expect(findBoardInLanguage(mockBoard, "de")).toBeUndefined();
  });
});
