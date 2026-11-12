import { stubTranslator } from "@shared/testing/stub-built-in-ai";
import { beforeEach, describe, expect, onTestFinished, test, vi } from "vitest";
import { getBoardSetRecord, listBoardSetRecords } from "@features/library";
import {
  getBoardRecord,
  makeBoardsDBUnreadable,
  makeOBFBoard,
  resetBoardsDB,
  seedBoardSets,
} from "@features/library/testing";
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
  const onTranslating = vi.fn<() => void>();
  const onTranslated = vi.fn<(boardSetId: string) => void>();
  await translateBoardSets(await listBoardSetRecords(), language, {
    signal,
    onTranslating,
    onTranslated,
  });

  return { onTranslating, onTranslated };
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

    const { onTranslating, onTranslated } = await runTranslation("es");

    expect(await readStrings("food", "home")).toEqual({
      es: { Home: "[es] Home", eat: "[es] eat", "eat now": "[es] eat now" },
    });
    expect(await readStrings("food", "fruit")).toEqual({
      es: { Fruit: "[es] Fruit", apple: "[es] apple" },
    });
    expect((await getBoardSetRecord("food"))?.translatedNames).toEqual({
      es: "[es] Food",
    });
    expect(onTranslating).toHaveBeenCalledOnce();
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

  test("translates a board whose language differs from its set's", async () => {
    await seedBoardSets([
      {
        id: "mixed",
        name: "Home",
        rootBoardId: "home",
        boards: [
          makeOBFBoard({ id: "home", name: "Home" }),
          makeOBFBoard({ id: "maison", name: "Maison", locale: "fr-FR" }),
        ],
      },
    ]);
    const { create } = stubTranslator((input) => `[en] ${input}`);

    await runTranslation("en");

    expect(create.mock.calls.map((call) => call.at(0))).toEqual([
      expect.objectContaining({ sourceLanguage: "fr", targetLanguage: "en" }),
    ]);
    expect(await readStrings("mixed", "maison")).toEqual({
      en: { Maison: "[en] Maison" },
    });
    expect(await readStrings("mixed", "home")).toBeUndefined();
    expect((await getBoardSetRecord("mixed"))?.translatedNames).toEqual({
      en: "Home",
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

    const { onTranslating, onTranslated } = await runTranslation("es");

    expect(create).not.toHaveBeenCalled();
    expect(onTranslating).not.toHaveBeenCalled();
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

  test("rejects when storage fails instead of leaving the set as if no model were available", async () => {
    await seedFoodSet();
    const boardSets = await listBoardSetRecords();
    stubTranslator((input) => `[es] ${input}`);
    onTestFinished(await makeBoardsDBUnreadable());

    await expect(
      translateBoardSets(boardSets, "es", {
        signal: new AbortController().signal,
        onTranslating: vi.fn<() => void>(),
        onTranslated: vi.fn<(boardSetId: string) => void>(),
      }),
    ).rejects.toThrow();
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

    const { onTranslating, onTranslated } = await runTranslation("es");

    expect(translate).not.toHaveBeenCalled();
    expect((await getBoardSetRecord("food"))?.translatedNames).toBeUndefined();
    expect(onTranslating).not.toHaveBeenCalled();
    expect(onTranslated).not.toHaveBeenCalled();
  });

  test("names a set from its root board's own translations instead of translating the name", async () => {
    await seedBoardSets([
      {
        id: "home-set",
        name: "Home",
        rootBoardId: "home",
        boards: [
          makeOBFBoard({ id: "home", name: "Home" }),
          makeOBFBoard({
            id: "fruit",
            name: "Fruit",
            strings: { es: { Fruit: "Fruta" } },
          }),
        ],
      },
    ]);
    await seedBoardSets([
      {
        id: "shipped",
        name: "Home",
        rootBoardId: "home",
        boards: [
          makeOBFBoard({
            id: "home",
            name: "Home",
            strings: { es: { Home: "Inicio" } },
          }),
        ],
      },
    ]);
    const { translate } = stubTranslator((input) => `[es] ${input}`);

    await runTranslation("es");

    expect((await getBoardSetRecord("shipped"))?.translatedNames).toEqual({
      es: "Inicio",
    });
    expect((await getBoardSetRecord("home-set"))?.translatedNames).toEqual({
      es: "[es] Home",
    });
    expect(translate.mock.calls.map((call) => call.at(0))).toEqual(["Home"]);
  });

  test("names a set its board file fully translates when the Translator API is unavailable", async () => {
    await seedBoardSets([
      {
        id: "shipped",
        name: "Home",
        rootBoardId: "home",
        boards: [
          makeOBFBoard({
            id: "home",
            name: "Home",
            strings: { es: { Home: "Inicio" } },
          }),
        ],
      },
    ]);

    const { onTranslating, onTranslated } = await runTranslation("es");

    expect((await getBoardSetRecord("shipped"))?.translatedNames).toEqual({
      es: "Inicio",
    });
    expect(onTranslating).not.toHaveBeenCalled();
    expect(onTranslated.mock.calls).toEqual([["shipped"]]);
  });

  test("leaves a set with boards to translate untouched when the Translator API is unavailable", async () => {
    await seedBoardSets([
      {
        id: "partial",
        name: "Home",
        rootBoardId: "home",
        boards: [
          makeOBFBoard({
            id: "home",
            name: "Home",
            strings: { es: { Home: "Inicio" } },
          }),
          makeOBFBoard({ id: "fruit", name: "Fruit" }),
        ],
      },
    ]);

    const { onTranslated } = await runTranslation("es");

    expect(
      (await getBoardSetRecord("partial"))?.translatedNames,
    ).toBeUndefined();
    expect(onTranslated).not.toHaveBeenCalled();
  });
});
