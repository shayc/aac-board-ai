import { stubTranslator } from "@shared/testing/stub-built-in-ai";
import { beforeEach, describe, expect, test } from "vitest";
import { listBoardSets } from "../board-sets/board-sets-store";
import { makeOBFBoard, resetBoardsDB, seedBoardSets } from "../testing";
import { translateBoardSetNames } from "./translate-board-set-names";

async function readNameTranslations() {
  const boardSets = await listBoardSets();

  return Object.fromEntries(
    boardSets.map(({ id, nameTranslations }) => [id, nameTranslations]),
  );
}

function translateNamesToFrench() {
  return translateBoardSetNames("fr", new AbortController().signal);
}

describe("translateBoardSetNames", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("translates board set names named after their root board", async () => {
    await seedBoardSets([
      {
        id: "animals",
        name: "Animals",
        rootBoardId: "home",
        boards: [makeOBFBoard({ id: "home", name: "Animals" })],
      },
    ]);
    stubTranslator((input) => `[fr] ${input}`);

    await translateNamesToFrench();

    expect(await readNameTranslations()).toEqual({
      animals: { fr: "[fr] Animals" },
    });
  });

  test("uses the root board's own translation and keeps names not taken from it", async () => {
    await seedBoardSets([
      {
        id: "animals",
        name: "Animals",
        rootBoardId: "home",
        boards: [
          makeOBFBoard({
            id: "home",
            name: "Animals",
            strings: { fr: { Animals: "Animaux" } },
          }),
        ],
      },
      {
        id: "my-vocab",
        name: "my-vocab",
        rootBoardId: "home",
        boards: [makeOBFBoard({ id: "home", name: "Home" })],
      },
    ]);
    const { create } = stubTranslator();

    await translateNamesToFrench();

    expect(create).not.toHaveBeenCalled();
    expect(await readNameTranslations()).toEqual({
      animals: { fr: "Animaux" },
      "my-vocab": { fr: "my-vocab" },
    });
  });

  test("saves nothing for names the Translator could not translate", async () => {
    await seedBoardSets([
      {
        id: "animals",
        name: "Animals",
        rootBoardId: "home",
        boards: [makeOBFBoard({ id: "home", name: "Animals" })],
      },
    ]);

    await translateNamesToFrench();

    expect(await readNameTranslations()).toEqual({ animals: undefined });
  });
});
