import {
  makeOBFBoard,
  resetBoardsDB,
  seedBoardSets,
} from "@features/board/testing";
import {
  DEFAULT_LANGUAGE,
  setStoredLanguage,
} from "@shared/language/language-store";
import type { LoaderFunctionArgs } from "react-router";
import { beforeEach, describe, expect, test } from "vitest";
import { boardSetLoader } from "./board-set-loader";

function callLoader(
  setId: string | undefined,
): ReturnType<typeof boardSetLoader> {
  const args = {
    request: new Request("http://localhost/"),
    params: { setId },
  } as unknown as LoaderFunctionArgs;

  return boardSetLoader(args);
}

describe("boardSetLoader", () => {
  beforeEach(async () => {
    setStoredLanguage(DEFAULT_LANGUAGE);
    await resetBoardsDB();
  });

  test("throws 404 when setId is missing", async () => {
    await expect(callLoader(undefined)).rejects.toMatchObject({
      init: { status: 404 },
    });
  });

  test("throws 404 for an invalid setId", async () => {
    await expect(callLoader("x".repeat(256))).rejects.toMatchObject({
      init: { status: 404 },
    });
  });

  test("returns localized summaries sorted for the active language", async () => {
    await seedBoardSets([
      {
        setId: "set-1",
        rootBoardId: "root",
        boards: [
          {
            boardId: "root",
            name: "Home",
            obf: makeOBFBoard({
              id: "root",
              name: "Home",
              strings: { es: { Home: "Inicio" } },
            }),
          },
          {
            boardId: "animals",
            name: "Animals",
            obf: makeOBFBoard({
              id: "animals",
              name: "Animals",
              strings: { es: { Animals: "Animales" } },
            }),
          },
          {
            boardId: "food",
            name: "Food",
            obf: makeOBFBoard({ id: "food", name: "Food" }),
          },
        ],
      },
    ]);
    setStoredLanguage("es");

    const result = await callLoader("set-1");

    expect(result.language).toBe("es");
    expect(result.boards).toEqual([
      { boardId: "animals", name: "Animales" },
      { boardId: "food", name: "Food" },
      { boardId: "root", name: "Inicio" },
    ]);
  });
});
