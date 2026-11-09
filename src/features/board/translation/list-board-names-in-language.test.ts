import { beforeEach, expect, test } from "vitest";
import { insertBoardSet } from "../storage/board-set-storage";
import { makeOBFBoard, resetBoardsDB } from "../testing";
import { listBoardNamesInLanguage } from "./list-board-names-in-language";

beforeEach(async () => {
  await resetBoardsDB();
  await insertBoardSet({
    id: "set-1",
    rootBoardId: "home",
    boards: [
      makeOBFBoard({
        id: "home",
        name: "Home",
        strings: { es_MX: { Home: "Inicio" } },
      }),
      makeOBFBoard({ id: "food", name: "Food" }),
      makeOBFBoard({ id: "unnamed", name: "" }),
    ],
    assets: [],
  });
});

test("names each board in the language, falling back to its stored name", async () => {
  const names = await listBoardNamesInLanguage("set-1", "es");

  expect(names).toEqual(
    expect.arrayContaining([
      { id: "home", name: "Inicio" },
      { id: "food", name: "Food" },
      { id: "unnamed", name: "unnamed" },
    ]),
  );
});

test("keeps a board name that matches an inherited object property but is missing from its translations", async () => {
  await insertBoardSet({
    id: "set-2",
    rootBoardId: "root",
    boards: [
      makeOBFBoard({
        id: "root",
        name: "constructor",
        strings: { es: { Home: "Inicio" } },
      }),
    ],
    assets: [],
  });

  await expect(listBoardNamesInLanguage("set-2", "es")).resolves.toEqual([
    { id: "root", name: "constructor" },
  ]);
});
