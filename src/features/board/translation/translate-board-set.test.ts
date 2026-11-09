import type { OBFBoard } from "@shayc/open-board-format";
import { stubTranslator } from "@shared/testing/stub-built-in-ai";
import { beforeEach, describe, expect, test } from "vitest";
import { getBoardRecord } from "../storage/board-content-storage";
import { insertBoardSet } from "../storage/board-set-storage";
import { makeOBFBoard, resetBoardsDB } from "../testing";
import { translateBoardSet } from "./translate-board-set";

function makeBoard(id: string, name: string, label: string): OBFBoard {
  return makeOBFBoard({
    id,
    name,
    buttons: [{ id: `${id}-button`, label }],
    grid: { rows: 1, columns: 1, order: [[`${id}-button`]] },
  });
}

async function storeBoards(boards: OBFBoard[]): Promise<void> {
  await insertBoardSet({
    id: "set-1",
    rootBoardId: boards[0].id,
    boards,
    assets: [],
  });
}

async function readStrings(boardId: string) {
  return (await getBoardRecord("set-1", boardId))?.obf.strings;
}

function translateToSpanish(signal = new AbortController().signal) {
  return translateBoardSet("set-1", "es", signal);
}

describe("translateBoardSet", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("translates and saves every board without translations for the language", async () => {
    await storeBoards([
      makeBoard("home", "Home", "eat"),
      makeBoard("food", "Food", "drink"),
    ]);
    const { translate } = stubTranslator((input) => `[es] ${input}`);

    await expect(translateToSpanish()).resolves.toBe(true);

    expect(await readStrings("home")).toEqual({
      es: { Home: "[es] Home", eat: "[es] eat" },
    });
    expect(await readStrings("food")).toEqual({
      es: { Food: "[es] Food", drink: "[es] drink" },
    });
    expect(translate).toHaveBeenCalledTimes(4);
  });

  test("leaves boards that have their own translations or speak the language", async () => {
    await storeBoards([
      { ...makeBoard("home", "Home", "eat"), strings: { "es-MX": {} } },
      { ...makeBoard("food", "Comida", "beber"), locale: "es-ES" },
    ]);
    const { create } = stubTranslator();

    await expect(translateToSpanish()).resolves.toBe(false);

    expect(create).not.toHaveBeenCalled();
    expect(await readStrings("home")).toEqual({ "es-MX": {} });
    expect(await readStrings("food")).toBeUndefined();
  });

  test("keeps the boards translated before the Translator fails", async () => {
    await storeBoards([
      makeBoard("home", "Home", "eat"),
      makeBoard("food", "Food", "drink"),
    ]);
    stubTranslator((input) =>
      input === "Home"
        ? Promise.reject(new DOMException("model failure", "UnknownError"))
        : `[es] ${input}`,
    );

    await expect(translateToSpanish()).resolves.toBe(true);

    expect(await readStrings("food")).toEqual({
      es: { Food: "[es] Food", drink: "[es] drink" },
    });
    expect(await readStrings("home")).toBeUndefined();
  });

  test("translates nothing when the Translator is unavailable", async () => {
    await storeBoards([makeBoard("home", "Home", "eat")]);

    await expect(translateToSpanish()).resolves.toBe(false);

    expect(await readStrings("home")).toBeUndefined();
  });

  test("rejects when aborted mid-translation", async () => {
    await storeBoards([makeBoard("home", "Home", "eat")]);
    const controller = new AbortController();
    stubTranslator(() => {
      controller.abort();

      return Promise.reject(controller.signal.reason);
    });

    await expect(translateToSpanish(controller.signal)).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});
