import type { OBFBoard } from "@shayc/open-board-format";
import { stubTranslator } from "@shared/testing/stub-built-in-ai";
import { beforeEach, describe, expect, test } from "vitest";
import { insertBoardSet } from "../storage/board-set-storage";
import { resetBoardsDB } from "../testing";
import { loadBoardInLanguage } from "./load-board-in-language";

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

    const board = await loadBoardInLanguage("set-1", "board-1", "en");

    expect(board.name).toBe("Food");
    expect(board.buttons[0].label).toBe("eat");
    expect(create).not.toHaveBeenCalled();
  });

  test("applies the board's own translations without invoking the Translator", async () => {
    await storeBoard({
      strings: { "es-ES": { Food: "Comida", eat: "comer", drink: "beber" } },
    });
    const { create } = stubTranslator();

    const board = await loadBoardInLanguage("set-1", "board-1", "es");

    expect(board.name).toBe("Comida");
    expect(board.buttons[0].label).toBe("comer");
    expect(board.buttons[0].vocalization).toBe("comer");
    expect(board.buttons[1].label).toBe("beber");
    expect(create).not.toHaveBeenCalled();
  });

  test("returns the source board without translating when it has no translations for the language", async () => {
    await storeBoard();
    const { create } = stubTranslator((input) => `[es] ${input}`);

    const board = await loadBoardInLanguage("set-1", "board-1", "es");

    expect(board.name).toBe("Food");
    expect(board.buttons[0].label).toBe("eat");
    expect(create).not.toHaveBeenCalled();
  });

  test("leaves text that matches an Object property untranslated instead of failing", async () => {
    await storeBoard({
      buttons: [{ id: "btn-to-string", label: "toString" }],
      grid: { rows: 1, columns: 1, order: [["btn-to-string"]] },
      strings: { es: { Food: "Comida" } },
    });

    const board = await loadBoardInLanguage("set-1", "board-1", "es");

    expect(board.name).toBe("Comida");
    expect(board.buttons[0].label).toBe("toString");
  });
});
