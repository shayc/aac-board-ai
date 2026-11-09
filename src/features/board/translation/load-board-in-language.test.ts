import type { OBFBoard } from "@shayc/open-board-format";
import { stubTranslator } from "@shared/testing/stub-built-in-ai";
import { beforeEach, describe, expect, test } from "vitest";
import { getBoardRecord } from "../storage/board-content-storage";
import { insertBoardSet } from "../storage/board-set-storage";
import { resetBoardsDB } from "../testing";
import { loadBoardInLanguage } from "./load-board-in-language";

const BOARD_KEY = { boardSetId: "set-1", boardId: "board-1" };

function makeOBFBoard(overrides: Partial<OBFBoard> = {}): OBFBoard {
  return {
    format: "open-board-0.1",
    id: "board-1",
    name: "Food",
    locale: "en-US",
    buttons: [
      { id: "btn-eat", label: "eat", vocalization: "eat" },
      { id: "btn-drink", label: "drink" },
    ],
    grid: { rows: 1, columns: 2, order: [["btn-eat", "btn-drink"]] },
    ...overrides,
  };
}

async function storeBoard(overrides: Partial<OBFBoard> = {}): Promise<void> {
  await insertBoardSet({
    id: "set-1",
    rootBoardId: "board-1",
    boards: [makeOBFBoard(overrides)],
    assets: [],
  });
}

describe("loadBoardInLanguage", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("returns the source board when its language matches the target", async () => {
    await storeBoard();
    const { create } = stubTranslator();

    const board = await loadBoardInLanguage(BOARD_KEY, "en");

    expect(board.name).toBe("Food");
    expect(board.buttons[0]?.label).toBe("eat");
    expect(create).not.toHaveBeenCalled();
  });

  test("applies the board's own translations without invoking the Translator", async () => {
    await storeBoard({
      strings: { "es-ES": { Food: "Comida", eat: "comer", drink: "beber" } },
    });
    const { create } = stubTranslator();

    const board = await loadBoardInLanguage(BOARD_KEY, "es");

    expect(board.name).toBe("Comida");
    expect(board.buttons[0]?.label).toBe("comer");
    expect(board.buttons[0]?.vocalization).toBe("comer");
    expect(board.buttons[1]?.label).toBe("beber");
    expect(create).not.toHaveBeenCalled();
  });

  test("keeps text that matches an inherited object property but is missing from the board's translations", async () => {
    await storeBoard({
      name: "constructor",
      buttons: [{ id: "btn-eat", label: "toString", vocalization: "valueOf" }],
      grid: { rows: 1, columns: 1, order: [["btn-eat"]] },
      strings: { "es-ES": { Food: "Comida" } },
    });

    const board = await loadBoardInLanguage(BOARD_KEY, "es");

    expect(board.name).toBe("constructor");
    expect(board.buttons[0]?.label).toBe("toString");
    expect(board.buttons[0]?.vocalization).toBe("valueOf");
  });

  test("translates via the Translator API when the board has no translations for the language", async () => {
    await storeBoard();
    const { create, translate } = stubTranslator((input) => `[es] ${input}`);

    const board = await loadBoardInLanguage(BOARD_KEY, "es");

    expect(board.name).toBe("[es] Food");
    expect(board.buttons[0]?.label).toBe("[es] eat");
    expect(board.buttons[0]?.vocalization).toBe("[es] eat");
    expect(board.buttons[1]?.label).toBe("[es] drink");

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

  test("caches a fresh translation", async () => {
    await storeBoard();
    stubTranslator((input) => `[es] ${input}`);

    await loadBoardInLanguage(BOARD_KEY, "es");

    const cachedStrings = {
      es: { Food: "[es] Food", eat: "[es] eat", drink: "[es] drink" },
    };

    await expect
      .poll(async () => (await getBoardRecord(BOARD_KEY))?.obf.strings)
      .toEqual(cachedStrings);
  });

  test("falls back to the source board when the Translator is unavailable", async () => {
    await storeBoard();

    const board = await loadBoardInLanguage(BOARD_KEY, "es");

    expect(board.name).toBe("Food");
  });

  test("falls back to the source board when the platform fails mid-translation", async () => {
    await storeBoard();
    stubTranslator(() =>
      Promise.reject(new DOMException("model failure", "UnknownError")),
    );

    const board = await loadBoardInLanguage(BOARD_KEY, "es");

    expect(board.name).toBe("Food");
    expect(board.buttons[0]?.label).toBe("eat");
  });

  test("rejects instead of falling back when the load is aborted mid-translation", async () => {
    await storeBoard();
    const controller = new AbortController();
    stubTranslator(() => {
      controller.abort();

      return Promise.reject(controller.signal.reason);
    });

    await expect(
      loadBoardInLanguage(BOARD_KEY, "es", controller.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});
