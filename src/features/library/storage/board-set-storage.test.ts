import { assertDefined } from "@shared/testing/assert-defined";
import type { OBFBoard } from "@shayc/open-board-format";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  countStoredBoardContent,
  makeAssetInput,
  makeBoardSetInput,
  makeOBFBoard,
  resetBoardsDB,
} from "../testing";
import { getAssetBlob, getBoardRecord } from "./board-content-storage";
import {
  BoardSetAlreadyExistsError,
  deleteBoardSetRecords,
  getBoardSetRecord,
  insertBoardSetRecords,
  listBoardSetRecords,
  updateBoardSetTranslations,
} from "./board-set-storage";
import { closeBoardsDB } from "./boards-db";

beforeEach(async () => {
  await resetBoardsDB();
});

afterEach(closeBoardsDB);

describe("insertBoardSetRecords", () => {
  test("stores the board set's metadata and its boards unchanged", async () => {
    const rootBoard = makeOBFBoard({ id: "root", name: "Root" });
    const source = structuredClone(rootBoard);

    await insertBoardSetRecords({
      id: "vocabulary",
      rootBoardId: "root",
      name: "Core words",
      author: "Author",
      description: "A communication board",
      license: "CC-BY",
      locale: "pt-BR",
      gridRows: 2,
      gridColumns: 3,
      boards: [makeOBFBoard({ id: "child", name: "Child" }), rootBoard],
      assets: [],
    });

    expect(await listBoardSetRecords()).toEqual([
      expect.objectContaining({
        id: "vocabulary",
        name: "Core words",
        rootBoardId: "root",
        boardCount: 2,
        author: "Author",
        description: "A communication board",
        license: "CC-BY",
        locale: "pt-BR",
        gridRows: 2,
        gridColumns: 3,
      }),
    ]);
    expect(
      (await getBoardRecord({ boardSetId: "vocabulary", boardId: "root" }))
        ?.obf,
    ).toEqual(source);
    expect(rootBoard).toEqual(source);
  });

  test("rejects a missing root without storing a partial board set", async () => {
    await expect(
      insertBoardSetRecords(makeBoardSetInput({ rootBoardId: "missing" })),
    ).rejects.toThrow("Root board not found");

    expect(await listBoardSetRecords()).toEqual([]);
    expect(
      await getBoardRecord({ boardSetId: "set-1", boardId: "root-1" }),
    ).toBeUndefined();
  });

  test("rejects duplicate board IDs without overwriting a board", async () => {
    await expect(
      insertBoardSetRecords(
        makeBoardSetInput({
          boards: [
            makeOBFBoard({ id: "root-1", name: "Original" }),
            makeOBFBoard({ id: "root-1", name: "Replacement" }),
          ],
        }),
      ),
    ).rejects.toThrow("Duplicate board ID");

    expect(await listBoardSetRecords()).toEqual([]);
    expect(
      await getBoardRecord({ boardSetId: "set-1", boardId: "root-1" }),
    ).toBeUndefined();
  });

  test("rejects a conflicting ID without changing the existing board set", async () => {
    await insertBoardSetRecords(
      makeBoardSetInput({
        id: "set-1",
        name: "Original",
        rootBoardId: "a",
        boards: [makeOBFBoard({ id: "a", name: "A" })],
        assets: [makeAssetInput("x.png", "x")],
      }),
    );

    await expect(
      insertBoardSetRecords(
        makeBoardSetInput({
          id: "set-1",
          name: "Replacement",
          rootBoardId: "b",
          boards: [makeOBFBoard({ id: "b", name: "B" })],
          assets: [],
        }),
      ),
    ).rejects.toBeInstanceOf(BoardSetAlreadyExistsError);

    expect(
      await getBoardRecord({ boardSetId: "set-1", boardId: "a" }),
    ).toBeDefined();
    expect(
      await getBoardRecord({ boardSetId: "set-1", boardId: "b" }),
    ).toBeUndefined();
    expect(await getAssetBlob("set-1", "x.png")).toBeInstanceOf(Blob);
    expect((await listBoardSetRecords())[0]?.name).toBe("Original");
  });

  test("stores each board's OBF source unchanged under its key", async () => {
    const obf = makeOBFBoard({ id: "root-1", name: "  " });
    const source = structuredClone(obf);

    await insertBoardSetRecords(makeBoardSetInput({ boards: [obf] }));

    expect(
      await getBoardRecord({ boardSetId: "set-1", boardId: "root-1" }),
    ).toEqual({ boardSetId: "set-1", id: "root-1", obf: source });
    expect(obf).toEqual(source);
  });

  test("aborts the entire transaction when a board fails to clone", async () => {
    const uncloneableOBF = {
      ...makeOBFBoard({ id: "b" }),
      onFail: () => "noop",
    } as unknown as OBFBoard;

    await expect(
      insertBoardSetRecords(
        makeBoardSetInput({
          boards: [uncloneableOBF],
          assets: [makeAssetInput("x.png", "x")],
        }),
      ),
    ).rejects.toThrow();

    expect(await listBoardSetRecords()).toEqual([]);
    expect(
      await getBoardRecord({ boardSetId: "set-1", boardId: "b" }),
    ).toBeUndefined();
    expect(await getAssetBlob("set-1", "x.png")).toBeUndefined();
  });

  test("rejects an asset whose path names no file without storing the board set", async () => {
    await expect(
      insertBoardSetRecords(
        makeBoardSetInput({
          assets: [makeAssetInput("/", "x")],
        }),
      ),
    ).rejects.toThrow("Invalid asset path");

    expect(await listBoardSetRecords()).toEqual([]);
  });

  test("stores the later asset when two paths name the same file", async () => {
    await insertBoardSetRecords(
      makeBoardSetInput({
        assets: [
          makeAssetInput("images/a.png", "first"),
          makeAssetInput("images//a.png", "second"),
        ],
      }),
    );

    const asset = await getAssetBlob("set-1", "images/a.png");
    assertDefined(asset);
    expect(await asset.text()).toBe("second");
  });

  test("stores only the bytes an asset views in a larger buffer", async () => {
    const archive = new TextEncoder().encode("before|asset|after");

    await insertBoardSetRecords(
      makeBoardSetInput({
        assets: [
          { path: "x.png", bytes: archive.subarray(7, 12), type: "image/png" },
        ],
      }),
    );

    const asset = await getAssetBlob("set-1", "x.png");
    assertDefined(asset);
    expect(await asset.text()).toBe("asset");
  });

  test.each([
    {
      problem: "an empty boardSetId",
      input: { id: "" },
      error: "Invalid boardSetId",
    },
    {
      problem: "a boardSetId longer than 255 characters",
      input: { id: "x".repeat(256) },
      error: "Invalid boardSetId",
    },
    {
      problem: "an empty rootBoardId",
      input: { rootBoardId: "" },
      error: "Invalid rootBoardId",
    },
    {
      problem: "an empty boardId",
      input: {
        boards: [makeOBFBoard({ id: "root-1" }), makeOBFBoard({ id: "" })],
      },
      error: "Invalid boardId",
    },
    {
      problem: "a boardId longer than 255 characters",
      input: {
        boards: [
          makeOBFBoard({ id: "root-1" }),
          makeOBFBoard({ id: "x".repeat(256) }),
        ],
      },
      error: "Invalid boardId",
    },
  ])("rejects $problem", async ({ input, error }) => {
    await expect(
      insertBoardSetRecords(makeBoardSetInput(input)),
    ).rejects.toThrow(error);
  });
});

describe("listBoardSetRecords", () => {
  test("returns an empty array when no board sets are stored", async () => {
    const sets = await listBoardSetRecords();
    expect(sets).toEqual([]);
  });

  test("returns the most recently imported board sets first", async () => {
    let now = 1000;
    vi.spyOn(Date, "now").mockImplementation(() => (now += 1000));

    await insertBoardSetRecords(
      makeBoardSetInput({
        id: "old",
        name: "Old",
        rootBoardId: "root-1",
      }),
    );
    await insertBoardSetRecords(
      makeBoardSetInput({
        id: "new",
        name: "New",
        rootBoardId: "root-1",
      }),
    );

    const sets = await listBoardSetRecords();
    expect(sets).toHaveLength(2);
    expect(sets[0]?.id).toBe("new");
    expect(sets[1]?.id).toBe("old");
  });
});

describe("deleteBoardSetRecords", () => {
  test("deletes the board set and all its content, keeping another whose ID it prefixes", async () => {
    await insertBoardSetRecords(
      makeBoardSetInput({
        boards: [
          makeOBFBoard({ id: "b1", name: "B1" }),
          makeOBFBoard({ id: "b2", name: "B2" }),
        ],
        assets: [
          makeAssetInput("img1.png", "a"),
          makeAssetInput("img2.png", "b"),
        ],
      }),
    );

    await insertBoardSetRecords(
      makeBoardSetInput({
        id: "set-1-2",
        name: "Set 2",
        rootBoardId: "b1",
        boards: [makeOBFBoard({ id: "b1", name: "Survivor" })],
        assets: [makeAssetInput("img1.png", "survivor")],
      }),
    );

    await deleteBoardSetRecords("set-1");

    const sets = await listBoardSetRecords();
    expect(sets.map((set) => set.id)).toEqual(["set-1-2"]);
    expect(
      await getBoardRecord({ boardSetId: "set-1", boardId: "b1" }),
    ).toBeUndefined();
    expect(
      await getBoardRecord({ boardSetId: "set-1", boardId: "b2" }),
    ).toBeUndefined();
    expect(await getAssetBlob("set-1", "img1.png")).toBeUndefined();
    expect(await getAssetBlob("set-1", "img2.png")).toBeUndefined();

    expect(
      await getBoardRecord({ boardSetId: "set-1-2", boardId: "b1" }),
    ).toMatchObject({
      obf: { name: "Survivor" },
    });
    const asset = await getAssetBlob("set-1-2", "img1.png");
    assertDefined(asset);
    expect(await asset.text()).toBe("survivor");
  });

  test.each(["missing", ""])(
    "leaves stored board sets alone when no board set has the ID %j",
    async (boardSetId) => {
      await insertBoardSetRecords(makeBoardSetInput());

      await deleteBoardSetRecords(boardSetId);

      const sets = await listBoardSetRecords();
      expect(sets.map((set) => set.id)).toEqual(["set-1"]);
    },
  );
});

describe("updateBoardSetTranslations", () => {
  test("adds the language to the board set name and each board, keeping other languages", async () => {
    await insertBoardSetRecords(
      makeBoardSetInput({
        boards: [
          makeOBFBoard({
            id: "home",
            name: "Home",
            strings: { fr: { Home: "Accueil" } },
          }),
        ],
      }),
    );

    await updateBoardSetTranslations("set-1", "es", {
      name: "Conjunto",
      translationsByBoardId: new Map([["home", new Map([["Home", "Inicio"]])]]),
    });

    const board = await getBoardRecord({
      boardSetId: "set-1",
      boardId: "home",
    });
    expect(board?.obf.strings).toEqual({
      fr: { Home: "Accueil" },
      es: { Home: "Inicio" },
    });
    expect((await getBoardSetRecord("set-1"))?.translatedNames).toEqual({
      es: "Conjunto",
    });
  });

  test("saves nothing when one board's translations fail to store", async () => {
    await insertBoardSetRecords(
      makeBoardSetInput({
        boards: [makeOBFBoard({ id: "a" }), makeOBFBoard({ id: "b" })],
      }),
    );
    const uncloneable = (() => "noop") as unknown as string;

    await expect(
      updateBoardSetTranslations("set-1", "es", {
        name: "Conjunto",
        translationsByBoardId: new Map([
          ["a", new Map([["Test Board", "Tablero"]])],
          ["b", new Map([["Test Board", uncloneable]])],
        ]),
      }),
    ).rejects.toThrow();

    const board = await getBoardRecord({ boardSetId: "set-1", boardId: "a" });
    expect(board?.obf.strings).toBeUndefined();
    expect((await getBoardSetRecord("set-1"))?.translatedNames).toBeUndefined();
  });

  test("writes nothing for a board set deleted before the save", async () => {
    await insertBoardSetRecords(makeBoardSetInput());
    await deleteBoardSetRecords("set-1");

    await updateBoardSetTranslations("set-1", "es", {
      name: "Conjunto",
      translationsByBoardId: new Map([
        ["root-1", new Map([["Test Board", "x"]])],
      ]),
    });

    expect(await getBoardSetRecord("set-1")).toBeUndefined();
    expect(await countStoredBoardContent("set-1")).toEqual({
      boardCount: 0,
      assetCount: 0,
    });
  });
});
