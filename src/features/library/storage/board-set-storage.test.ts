import { assertDefined } from "@shared/testing/assert-defined";
import type { OBFBoard } from "@shayc/open-board-format";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  countStoredBoardContent,
  makeBoardSetInput,
  makeOBFBoard,
  resetBoardsDB,
} from "../testing";
import { getAssetBlob, getBoardRecord } from "./board-content-storage";
import {
  BoardSetAlreadyExistsError,
  getBoardSetRecord,
  insertBoardSet,
  listBoardSetRecords,
  removeBoardSet,
  saveBoardSetTranslations,
} from "./board-set-storage";
import { closeBoardsDB, InvalidIdError } from "./boards-db";

beforeEach(async () => {
  await resetBoardsDB();
});

afterEach(closeBoardsDB);

describe("insertBoardSet", () => {
  test("derives set metadata from the selected root without changing its source", async () => {
    const rootBoard = makeOBFBoard({
      id: "root",
      name: "Core words",
      locale: "pt_br",
      description_html: "<p>A <strong>communication</strong> board</p>",
      license: { type: "CC-BY", author_name: "Author" },
      grid: {
        rows: 2,
        columns: 3,
        order: [
          [null, null, null],
          [null, null, null],
        ],
      },
    });
    const source = structuredClone(rootBoard);

    await insertBoardSet({
      id: "vocabulary",
      rootBoardId: "root",
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

  test("asks the browser to keep stored boards only once a set is stored", async () => {
    const persist = vi
      .spyOn(navigator.storage, "persist")
      .mockResolvedValue(true);

    await expect(
      insertBoardSet(makeBoardSetInput({ rootBoardId: "missing" })),
    ).rejects.toThrow("Root board not found");

    expect(persist).not.toHaveBeenCalled();

    await insertBoardSet(makeBoardSetInput());

    expect(persist).toHaveBeenCalledOnce();
  });

  test("stores a set without asking to persist outside a secure context", async () => {
    vi.spyOn(window, "isSecureContext", "get").mockReturnValue(false);
    const persist = vi.spyOn(navigator.storage, "persist");

    await insertBoardSet(makeBoardSetInput({ id: "insecure" }));

    expect(persist).not.toHaveBeenCalled();
    expect(await getBoardSetRecord("insecure")).toBeDefined();
  });

  test("rejects a missing root without storing a partial set", async () => {
    await expect(
      insertBoardSet(makeBoardSetInput({ rootBoardId: "missing" })),
    ).rejects.toThrow("Root board not found");

    expect(await listBoardSetRecords()).toEqual([]);
    expect(
      await getBoardRecord({ boardSetId: "set-1", boardId: "root-1" }),
    ).toBeUndefined();
  });

  test("rejects duplicate board IDs without overwriting a board", async () => {
    await expect(
      insertBoardSet(
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

  test("rejects a conflicting ID without changing the existing set", async () => {
    await insertBoardSet(
      makeBoardSetInput({
        id: "set-1",
        name: "Original",
        rootBoardId: "a",
        boards: [makeOBFBoard({ id: "a", name: "A" })],
        assets: [{ path: "x.png", blob: new Blob(["x"]) }],
      }),
    );

    await expect(
      insertBoardSet(
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

  test.each([
    { name: "Home", expectedName: "Home", expectedSetName: "Home" },
    { name: undefined, expectedName: "root-1", expectedSetName: "set-1" },
    { name: "", expectedName: "root-1", expectedSetName: "set-1" },
    { name: "  ", expectedName: "root-1", expectedSetName: "set-1" },
  ])(
    "derives display names without changing the OBF source ($name)",
    async ({ name, expectedName, expectedSetName }) => {
      const obf = makeOBFBoard({ id: "root-1", name });

      await insertBoardSet(
        makeBoardSetInput({ name: undefined, boards: [obf] }),
      );

      expect(
        await getBoardRecord({ boardSetId: "set-1", boardId: "root-1" }),
      ).toEqual({
        boardSetId: "set-1",
        id: "root-1",
        name: expectedName,
        obf,
      });
      expect(obf.name).toBe(name);
      expect((await listBoardSetRecords())[0]?.name).toBe(expectedSetName);
    },
  );

  test("aborts the entire transaction when a board fails to clone", async () => {
    const uncloneableOBF = {
      ...makeOBFBoard({ id: "b" }),
      onFail: () => "noop",
    } as unknown as OBFBoard;

    await expect(
      insertBoardSet(
        makeBoardSetInput({
          boards: [uncloneableOBF],
          assets: [{ path: "x.png", blob: new Blob(["x"]) }],
        }),
      ),
    ).rejects.toThrow();

    expect(await listBoardSetRecords()).toEqual([]);
    expect(
      await getBoardRecord({ boardSetId: "set-1", boardId: "b" }),
    ).toBeUndefined();
    expect(await getAssetBlob("set-1", "x.png")).toBeUndefined();
  });

  test("rejects empty boardSetId with a typed InvalidIdError", async () => {
    await expect(
      insertBoardSet(
        makeBoardSetInput({
          id: "",
          name: "Bad",
          rootBoardId: "root-1",
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidIdError);
  });

  test("rejects boardSetId longer than 255 characters", async () => {
    await expect(
      insertBoardSet(
        makeBoardSetInput({
          id: "x".repeat(256),
          name: "Bad",
          rootBoardId: "root-1",
        }),
      ),
    ).rejects.toThrow("Invalid boardSetId");
  });

  test("rejects empty rootBoardId", async () => {
    await expect(
      insertBoardSet(
        makeBoardSetInput({
          id: "set-1",
          name: "Bad",
          rootBoardId: "",
        }),
      ),
    ).rejects.toThrow("Invalid rootBoardId");
  });

  test("rejects empty boardId", async () => {
    await expect(
      insertBoardSet(
        makeBoardSetInput({
          boards: [makeOBFBoard({ id: "root-1" }), makeOBFBoard({ id: "" })],
        }),
      ),
    ).rejects.toThrow("Invalid boardId");
  });

  test("rejects boardId longer than 255 characters", async () => {
    await expect(
      insertBoardSet(
        makeBoardSetInput({
          boards: [
            makeOBFBoard({ id: "root-1" }),
            makeOBFBoard({ id: "x".repeat(256) }),
          ],
        }),
      ),
    ).rejects.toThrow("Invalid boardId");
  });
});

describe("listBoardSetRecords", () => {
  test("returns empty array when no sets exist", async () => {
    const sets = await listBoardSetRecords();
    expect(sets).toEqual([]);
  });

  test("returns sets sorted by updatedAt descending", async () => {
    let now = 1000;
    vi.spyOn(Date, "now").mockImplementation(() => (now += 1000));

    await insertBoardSet(
      makeBoardSetInput({
        id: "old",
        name: "Old",
        rootBoardId: "root-1",
      }),
    );
    await insertBoardSet(
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

describe("removeBoardSet", () => {
  test("deletes the set and all its content while preserving a set whose ID it prefixes", async () => {
    await insertBoardSet(
      makeBoardSetInput({
        boards: [
          makeOBFBoard({ id: "b1", name: "B1" }),
          makeOBFBoard({ id: "b2", name: "B2" }),
        ],
        assets: [
          { path: "img1.png", blob: new Blob(["a"]) },
          { path: "img2.png", blob: new Blob(["b"]) },
        ],
      }),
    );

    await insertBoardSet(
      makeBoardSetInput({
        id: "set-1-2",
        name: "Set 2",
        rootBoardId: "b1",
        boards: [makeOBFBoard({ id: "b1", name: "Survivor" })],
        assets: [{ path: "img1.png", blob: new Blob(["survivor"]) }],
      }),
    );

    await removeBoardSet("set-1");

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
      name: "Survivor",
    });
    const asset = await getAssetBlob("set-1-2", "img1.png");
    assertDefined(asset);
    expect(await asset.text()).toBe("survivor");
  });

  test("rejects empty boardSetId", async () => {
    await expect(removeBoardSet("")).rejects.toThrow("Invalid boardSetId");
  });
});

describe("saveBoardSetTranslations", () => {
  test("adds the language to the set name and each board, keeping other languages", async () => {
    await insertBoardSet(
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

    await saveBoardSetTranslations("set-1", "es", {
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
    await insertBoardSet(
      makeBoardSetInput({
        boards: [makeOBFBoard({ id: "a" }), makeOBFBoard({ id: "b" })],
      }),
    );
    const uncloneable = (() => "noop") as unknown as string;

    await expect(
      saveBoardSetTranslations("set-1", "es", {
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

  test("writes nothing for a set deleted before the save", async () => {
    await insertBoardSet(makeBoardSetInput());
    await removeBoardSet("set-1");

    await saveBoardSetTranslations("set-1", "es", {
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
