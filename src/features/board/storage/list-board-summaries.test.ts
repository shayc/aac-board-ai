import { afterEach, beforeEach, expect, test } from "vitest";
import { makeBoardSetInput, makeOBFBoard, resetBoardsDB } from "../testing";
import { insertBoardSet } from "./board-set-storage";
import { closeBoardsDB } from "./boards-db";
import { listBoardSummaries } from "./list-board-summaries";

beforeEach(async () => {
  await resetBoardsDB();
});

afterEach(closeBoardsDB);

test("maps stored boards to summaries with normalized translation locales", async () => {
  await insertBoardSet(
    makeBoardSetInput({
      rootBoardId: "a",
      boards: [
        makeOBFBoard({
          id: "a",
          name: "Food",
          strings: { es_MX: { Food: "Comida" } },
        }),
      ],
    }),
  );

  const summaries = await listBoardSummaries("set-1");

  expect(summaries).toEqual([
    {
      id: "a",
      name: "Food",
      translationsByLocale: new Map([["es-MX", new Map([["Food", "Comida"]])]]),
    },
  ]);
});
