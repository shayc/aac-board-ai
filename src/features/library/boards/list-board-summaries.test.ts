import { afterEach, beforeEach, expect, test } from "vitest";
import { makeBoardSetInput, makeOBFBoard, resetBoardsDB } from "../testing";
import { insertBoardSet } from "../storage/board-set-storage";
import { closeBoardsDB } from "../storage/boards-db";
import { listBoardSummaries } from "./list-board-summaries";

beforeEach(async () => {
  await resetBoardsDB();
});

afterEach(closeBoardsDB);

test("maps stored boards to summaries with their names by language", async () => {
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
      translatedNames: { es: "Comida" },
    },
  ]);
});

test("takes a name from the first locale of a language, as the board itself does", async () => {
  await insertBoardSet(
    makeBoardSetInput({
      rootBoardId: "a",
      boards: [
        makeOBFBoard({
          id: "a",
          name: "Food",
          strings: {
            "es-ES": { eat: "comer" },
            "es-MX": { Food: "Comida" },
            "fr-FR": { Food: "Nourriture" },
          },
        }),
      ],
    }),
  );

  const [summary] = await listBoardSummaries("set-1");

  expect(summary?.translatedNames).toEqual({ fr: "Nourriture" });
});
