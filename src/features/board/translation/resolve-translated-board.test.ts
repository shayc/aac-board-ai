import {
  stubBuiltInAIUnsupported,
  stubTranslator,
} from "@shared/testing/built-in-ai";
import { beforeEach, describe, expect, test } from "vitest";
import { getBoard, putBoards } from "../storage/boards-db";
import { resetBoardsDB, seedBoardSets } from "../storage/test-utils";
import type { Board } from "../types";
import { resolveTranslatedBoard } from "./resolve-translated-board";

function makeBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: "board-1",
    name: "Food",
    locale: "en-US",
    grid: { rows: 1, columns: 2 },
    buttons: [
      { id: "btn-eat", label: "eat", vocalization: "eat" },
      { id: "btn-drink", label: "drink" },
    ],
    ...overrides,
  };
}

describe("resolveTranslatedBoard", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("returns the board unchanged when its language matches the target", async () => {
    const board = makeBoard();
    const { create } = stubTranslator();

    const result = await resolveTranslatedBoard("set-1", board, "en");

    expect(result).toBe(board);
    expect(create).not.toHaveBeenCalled();
  });

  test("applies cached translations without invoking the Translator", async () => {
    const board = makeBoard({
      strings: { "es-ES": { Food: "Comida", eat: "comer", drink: "beber" } },
    });
    const { create } = stubTranslator();

    const result = await resolveTranslatedBoard("set-1", board, "es");

    expect(result.name).toBe("Comida");
    expect(result.buttons[0].label).toBe("comer");
    expect(result.buttons[0].vocalization).toBe("comer");
    expect(result.buttons[1].label).toBe("beber");
    expect(create).not.toHaveBeenCalled();
  });

  test("translates via the Translator API on a cache miss", async () => {
    const board = makeBoard();
    const { create, translate } = stubTranslator((input) => `[es] ${input}`);

    const result = await resolveTranslatedBoard("set-1", board, "es");

    expect(result.name).toBe("[es] Food");
    expect(result.buttons[0].label).toBe("[es] eat");
    expect(result.buttons[0].vocalization).toBe("[es] eat");
    expect(result.buttons[1].label).toBe("[es] drink");

    expect(create.mock.calls.at(0)?.at(0)).toMatchObject({
      sourceLanguage: "en",
      targetLanguage: "es",
    });

    const inputs = translate.mock.calls.map((call) => call.at(0));
    expect(inputs).toHaveLength(3);
    expect(inputs).toContain("Food");
    expect(inputs).toContain("eat");
    expect(inputs).toContain("drink");
  });

  test("persists a fresh translation so the next load hits the cache", async () => {
    await seedBoardSets([{ setId: "set-1", rootBoardId: "board-1" }]);
    await putBoards("set-1", [
      {
        boardId: "board-1",
        name: "Food",
        obf: {
          format: "open-board-0.1",
          id: "board-1",
          buttons: [],
          grid: { rows: 1, columns: 1, order: [[null]] },
        },
      },
    ]);
    stubTranslator((input) => `[es] ${input}`);

    await resolveTranslatedBoard("set-1", makeBoard(), "es");

    const persistedStrings = {
      es: { Food: "[es] Food", eat: "[es] eat", drink: "[es] drink" },
    };

    await expect
      .poll(async () => (await getBoard("set-1", "board-1"))?.obf.strings)
      .toEqual(persistedStrings);

    const { create } = stubTranslator();
    const result = await resolveTranslatedBoard(
      "set-1",
      makeBoard({ strings: persistedStrings }),
      "es",
    );

    expect(result.name).toBe("[es] Food");
    expect(create).not.toHaveBeenCalled();
  });

  test("falls back to the source board when the Translator is unavailable", async () => {
    const board = makeBoard();
    stubBuiltInAIUnsupported("Translator");

    const result = await resolveTranslatedBoard("set-1", board, "es");

    expect(result).toBe(board);
  });

  test("falls back to the source board when the platform fails mid-translation", async () => {
    const board = makeBoard();
    stubTranslator(() =>
      Promise.reject(new DOMException("model failure", "UnknownError")),
    );

    const result = await resolveTranslatedBoard("set-1", board, "es");

    expect(result).toBe(board);
  });

  test("falls back even on unexpected errors so the board always renders", async () => {
    const board = makeBoard();
    stubTranslator(() => {
      throw new TypeError("undefined is not a function");
    });

    const result = await resolveTranslatedBoard("set-1", board, "es");

    expect(result).toBe(board);
  });
});
