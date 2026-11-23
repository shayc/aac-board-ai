import { describe, expect, test } from "vitest";
import type { Board } from "../board-types";
import {
  applyTranslations,
  findStringTranslations,
  getSourceLanguage,
  resolveBoardInLanguage,
} from "./board-in-language";

const spanishTranslations = new Map([
  ["My Board", "Mi Tablero"],
  ["Hello", "Hola"],
  ["Hello there", "Hola a todos"],
]);
const frenchTranslations = new Map([["Hello", "Bonjour"]]);

const mockBoard: Board = {
  id: "board-1",
  name: "My Board",
  grid: { order: [["hello", "more"]] },
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

describe("resolveBoardInLanguage", () => {
  test.each<[string | undefined, string, string | undefined]>([
    ["en-US", "en", "en"],
    ["pt-BR", "de", "pt"],
    [undefined, "en", "en"],
    [undefined, "de", undefined],
  ])(
    "resolves source locale %s for requested language %s to %s",
    (locale, language, expected) => {
      const source = { ...mockBoard, locale };
      const result = resolveBoardInLanguage(source, language);

      expect(result.board).toBe(source);
      expect(result.boardLanguage).toBe(expected);
    },
  );

  test("returns the translated board and its language", () => {
    const { board, boardLanguage } = resolveBoardInLanguage(mockBoard, "es");

    expect(board.name).toBe("Mi Tablero");
    expect(board.buttons[0]?.label).toBe("Hola");
    expect(boardLanguage).toBe("es");
  });
});
