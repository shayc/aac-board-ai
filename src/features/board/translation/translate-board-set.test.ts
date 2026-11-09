import type { OBFBoard } from "@shayc/open-board-format";
import { stubTranslator } from "@shared/testing/stub-built-in-ai";
import { beforeEach, describe, expect, test, vi } from "vitest";
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

function translateToSpanish({
  firstBoardId,
  signal = new AbortController().signal,
  onBoardTranslated = vi.fn(),
}: {
  firstBoardId?: string;
  signal?: AbortSignal;
  onBoardTranslated?: () => void;
} = {}) {
  return translateBoardSet("set-1", "es", {
    firstBoardId,
    signal,
    onBoardTranslated,
  });
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
    const onBoardTranslated = vi.fn();

    await translateToSpanish({ onBoardTranslated });

    expect(onBoardTranslated).toHaveBeenCalledTimes(2);
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
    const onBoardTranslated = vi.fn();

    await translateToSpanish({ onBoardTranslated });

    expect(create).not.toHaveBeenCalled();
    expect(onBoardTranslated).not.toHaveBeenCalled();
    expect(await readStrings("home")).toEqual({ "es-MX": {} });
    expect(await readStrings("food")).toBeUndefined();
  });

  test("translates the first board before the rest", async () => {
    await storeBoards([
      makeBoard("food", "Food", "drink"),
      makeBoard("home", "Home", "eat"),
    ]);
    const { translate } = stubTranslator();

    await translateToSpanish({ firstBoardId: "home" });

    expect(translate.mock.calls.map(([input]) => input)).toEqual([
      "Home",
      "eat",
      "Food",
      "drink",
    ]);
  });

  test("translates the other boards when one fails", async () => {
    await storeBoards([
      makeBoard("food", "Food", "drink"),
      makeBoard("home", "Home", "eat"),
    ]);
    stubTranslator((input) =>
      input === "Food"
        ? Promise.reject(new DOMException("model failure", "UnknownError"))
        : `[es] ${input}`,
    );

    await translateToSpanish();

    expect(await readStrings("food")).toBeUndefined();
    expect(await readStrings("home")).toEqual({
      es: { Home: "[es] Home", eat: "[es] eat" },
    });
  });

  test("translates boards in other languages when one language pair is unavailable", async () => {
    await storeBoards([
      { ...makeBoard("essen", "Essen", "trinken"), locale: "de" },
      makeBoard("home", "Home", "eat"),
    ]);
    const { availability } = stubTranslator((input) => `[es] ${input}`);
    availability.mockImplementation((options) =>
      Promise.resolve(
        options?.sourceLanguage === "de" ? "unavailable" : "available",
      ),
    );

    await translateToSpanish();

    expect(await readStrings("essen")).toBeUndefined();
    expect(await readStrings("home")).toEqual({
      es: { Home: "[es] Home", eat: "[es] eat" },
    });
  });

  test("translates nothing when the Translator is unavailable", async () => {
    await storeBoards([makeBoard("home", "Home", "eat")]);

    await translateToSpanish();

    expect(await readStrings("home")).toBeUndefined();
  });

  test("rejects when aborted mid-translation", async () => {
    await storeBoards([makeBoard("home", "Home", "eat")]);
    const controller = new AbortController();
    stubTranslator(() => {
      controller.abort();

      return Promise.reject(controller.signal.reason);
    });

    await expect(
      translateToSpanish({ signal: controller.signal }),
    ).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});
