import { stubTranslator } from "@shared/testing/stub-built-in-ai";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getBoardRecord } from "../storage/board-content-storage";
import {
  getBoardSetRecord,
  listBoardSetRecords,
} from "../storage/board-set-storage";
import { makeOBFBoard, resetBoardsDB, seedBoardSets } from "../testing";
import { translateBoardSets } from "./translate-board-sets";

function seedFoodSet() {
  return seedBoardSets([
    {
      id: "food",
      name: "Food",
      rootBoardId: "home",
      boards: [
        makeOBFBoard({
          id: "home",
          name: "Home",
          buttons: [{ id: "eat", label: "eat", vocalization: "eat now" }],
        }),
        makeOBFBoard({
          id: "fruit",
          name: "Fruit",
          buttons: [{ id: "apple", label: "apple" }],
        }),
      ],
    },
  ]);
}

async function runTranslation(
  language: string,
  signal = new AbortController().signal,
) {
  const onTranslated = vi.fn<(boardSetId: string) => void>();
  await translateBoardSets(await listBoardSetRecords(), language, {
    signal,
    onTranslated,
  });

  return { onTranslated };
}

async function readStrings(boardSetId: string, boardId: string) {
  return (await getBoardRecord({ boardSetId, boardId }))?.obf.strings;
}

describe("translateBoardSets", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("saves translations for every board and the set name, then reports the set", async () => {
    await seedFoodSet();
    const { create } = stubTranslator((input) => `[es] ${input}`);

    const { onTranslated } = await runTranslation("es");

    expect(await readStrings("food", "home")).toEqual({
      es: { Home: "[es] Home", eat: "[es] eat", "eat now": "[es] eat now" },
    });
    expect(await readStrings("food", "fruit")).toEqual({
      es: { Fruit: "[es] Fruit", apple: "[es] apple" },
    });
    expect((await getBoardSetRecord("food"))?.translatedNames).toEqual({
      es: "[es] Food",
    });
    expect(onTranslated.mock.calls).toEqual([["food"]]);
    expect(create).toHaveBeenCalledOnce();
    expect(create.mock.calls.at(0)?.at(0)).toMatchObject({
      sourceLanguage: "en",
      targetLanguage: "es",
    });
  });

  test("translates each board from its own language", async () => {
    await seedBoardSets([
      {
        id: "mixed",
        rootBoardId: "home",
        boards: [
          makeOBFBoard({ id: "home", name: "Home" }),
          makeOBFBoard({ id: "maison", name: "Maison", locale: "fr-FR" }),
        ],
      },
    ]);
    const { create } = stubTranslator((input) => `[es] ${input}`);

    await runTranslation("es");

    const sourceLanguages = create.mock.calls.map(
      (call) => call.at(0)?.sourceLanguage,
    );
    expect(new Set(sourceLanguages)).toEqual(new Set(["en", "fr"]));
    expect(await readStrings("mixed", "maison")).toEqual({
      es: { Maison: "[es] Maison" },
    });
  });

  test("keeps a board's own translations and translates only the boards missing the language", async () => {
    await seedBoardSets([
      {
        id: "food",
        name: "Food",
        rootBoardId: "home",
        boards: [
          makeOBFBoard({
            id: "home",
            name: "Home",
            strings: { "es-ES": { Home: "Inicio" } },
          }),
          makeOBFBoard({ id: "fruit", name: "Fruit" }),
        ],
      },
    ]);
    const { translate } = stubTranslator((input) => `[es] ${input}`);

    await runTranslation("es");

    const inputs = translate.mock.calls.map((call) => call.at(0));
    expect(new Set(inputs)).toEqual(new Set(["Food", "Fruit"]));
    expect(await readStrings("food", "home")).toEqual({
      "es-ES": { Home: "Inicio" },
    });
  });

  test("skips sets already in the language without creating a Translator", async () => {
    await seedFoodSet();
    await seedBoardSets([
      {
        id: "comida",
        rootBoardId: "home",
        boards: [makeOBFBoard({ id: "home", locale: "es" })],
      },
    ]);
    stubTranslator((input) => `[es] ${input}`);
    await runTranslation("es");
    const { create } = stubTranslator();

    const { onTranslated } = await runTranslation("es");

    expect(create).not.toHaveBeenCalled();
    expect(onTranslated).not.toHaveBeenCalled();
  });

  test("leaves a set that fails in its source language and translates the rest", async () => {
    await seedFoodSet();
    await seedBoardSets([{ id: "zoo", name: "Zoo", rootBoardId: "home" }]);
    stubTranslator((input) =>
      input === "Food"
        ? Promise.reject(new DOMException("model failure", "UnknownError"))
        : `[es] ${input}`,
    );

    const { onTranslated } = await runTranslation("es");

    expect((await getBoardSetRecord("food"))?.translatedNames).toBeUndefined();
    expect(await readStrings("food", "home")).toBeUndefined();
    expect((await getBoardSetRecord("zoo"))?.translatedNames).toEqual({
      es: "[es] Zoo",
    });
    expect(onTranslated).toHaveBeenCalledOnce();
  });

  test("saves nothing when aborted mid-translation", async () => {
    await seedFoodSet();
    const controller = new AbortController();
    stubTranslator(() => {
      controller.abort();

      return Promise.reject(controller.signal.reason);
    });

    const { onTranslated } = await runTranslation("es", controller.signal);

    expect((await getBoardSetRecord("food"))?.translatedNames).toBeUndefined();
    expect(await readStrings("food", "home")).toBeUndefined();
    expect(onTranslated).not.toHaveBeenCalled();
  });

  test("leaves a set untranslated when its language has no translation model", async () => {
    await seedFoodSet();
    const { availability, translate } = stubTranslator();
    availability.mockResolvedValue("unavailable");

    const { onTranslated } = await runTranslation("es");

    expect(translate).not.toHaveBeenCalled();
    expect((await getBoardSetRecord("food"))?.translatedNames).toBeUndefined();
    expect(onTranslated).not.toHaveBeenCalled();
  });

  test("does nothing when the Translator API is unavailable", async () => {
    await seedFoodSet();

    const { onTranslated } = await runTranslation("es");

    expect((await getBoardSetRecord("food"))?.translatedNames).toBeUndefined();
    expect(onTranslated).not.toHaveBeenCalled();
  });
});
