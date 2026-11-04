import { assertDefined } from "@shared/testing/assert-defined";
import type { OBFBoard } from "@shayc/open-board-format";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { makeBoardSetInput, makeOBFBoard, resetBoardsDB } from "../testing";
import { getAssetBlob, getBoardRecord } from "./board-content-storage";
import {
  BoardSetAlreadyExistsError,
  createStoredBoardSet,
  deleteStoredBoardSet,
  listStoredBoardSets,
} from "./board-set-storage";
import { closeBoardsDB, InvalidIdError } from "./boards-db";

beforeEach(async () => {
  await resetBoardsDB();
});

afterEach(closeBoardsDB);

describe("createStoredBoardSet", () => {
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

    await createStoredBoardSet({
      id: "vocabulary",
      rootBoardId: "root",
      boards: [makeOBFBoard({ id: "child", name: "Child" }), rootBoard],
      assets: [],
    });

    expect(await listStoredBoardSets()).toEqual([
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
    expect((await getBoardRecord("vocabulary", "root"))?.obf).toEqual(source);
    expect(rootBoard).toEqual(source);
  });

  test("rejects a missing root without storing a partial set", async () => {
    await expect(
      createStoredBoardSet(makeBoardSetInput({ rootBoardId: "missing" })),
    ).rejects.toThrow("Root board not found");

    expect(await listStoredBoardSets()).toEqual([]);
    expect(await getBoardRecord("set-1", "root-1")).toBeUndefined();
  });

  test("rejects duplicate board IDs without overwriting a board", async () => {
    await expect(
      createStoredBoardSet(
        makeBoardSetInput({
          boards: [
            makeOBFBoard({ id: "root-1", name: "Original" }),
            makeOBFBoard({ id: "root-1", name: "Replacement" }),
          ],
        }),
      ),
    ).rejects.toThrow("Duplicate board ID");

    expect(await listStoredBoardSets()).toEqual([]);
    expect(await getBoardRecord("set-1", "root-1")).toBeUndefined();
  });

  test("rejects a conflicting ID without changing the existing set", async () => {
    await createStoredBoardSet(
      makeBoardSetInput({
        id: "set-1",
        name: "Original",
        rootBoardId: "a",
        boards: [makeOBFBoard({ id: "a", name: "A" })],
        assets: [{ path: "x.png", blob: new Blob(["x"]) }],
      }),
    );

    await expect(
      createStoredBoardSet(
        makeBoardSetInput({
          id: "set-1",
          name: "Replacement",
          rootBoardId: "b",
          boards: [makeOBFBoard({ id: "b", name: "B" })],
          assets: [],
        }),
      ),
    ).rejects.toBeInstanceOf(BoardSetAlreadyExistsError);

    expect(await getBoardRecord("set-1", "a")).toBeDefined();
    expect(await getBoardRecord("set-1", "b")).toBeUndefined();
    expect(await getAssetBlob("set-1", "x.png")).toBeInstanceOf(Blob);
    expect((await listStoredBoardSets())[0]?.name).toBe("Original");
  });

  test.each([
    { name: "Home", expectedName: "Home", expectedSetName: "Home" },
    { name: undefined, expectedName: "root-1", expectedSetName: "set-1" },
    { name: "", expectedName: "", expectedSetName: "" },
  ])(
    "derives display names without changing the OBF source ($name)",
    async ({ name, expectedName, expectedSetName }) => {
      const obf = makeOBFBoard({ id: "root-1", name });

      await createStoredBoardSet(
        makeBoardSetInput({ name: undefined, boards: [obf] }),
      );

      expect(await getBoardRecord("set-1", "root-1")).toEqual({
        boardSetId: "set-1",
        id: "root-1",
        name: expectedName,
        obf,
      });
      expect(obf.name).toBe(name);
      expect((await listStoredBoardSets())[0].name).toBe(expectedSetName);
    },
  );

  test("aborts the entire transaction when a board fails to clone", async () => {
    const uncloneableOBF = {
      ...makeOBFBoard({ id: "b" }),
      onFail: () => "noop",
    } as unknown as OBFBoard;

    await expect(
      createStoredBoardSet(
        makeBoardSetInput({
          boards: [uncloneableOBF],
          assets: [{ path: "x.png", blob: new Blob(["x"]) }],
        }),
      ),
    ).rejects.toThrow();

    expect(await listStoredBoardSets()).toEqual([]);
    expect(await getBoardRecord("set-1", "b")).toBeUndefined();
    expect(await getAssetBlob("set-1", "x.png")).toBeUndefined();
  });

  test("rejects empty boardSetId with a typed InvalidIdError", async () => {
    await expect(
      createStoredBoardSet(
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
      createStoredBoardSet(
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
      createStoredBoardSet(
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
      createStoredBoardSet(
        makeBoardSetInput({
          boards: [makeOBFBoard({ id: "root-1" }), makeOBFBoard({ id: "" })],
        }),
      ),
    ).rejects.toThrow("Invalid boardId");
  });

  test("rejects boardId longer than 255 characters", async () => {
    await expect(
      createStoredBoardSet(
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

describe("listStoredBoardSets", () => {
  test("returns empty array when no sets exist", async () => {
    const sets = await listStoredBoardSets();
    expect(sets).toEqual([]);
  });

  test("returns sets sorted by updatedAt descending", async () => {
    let now = 1000;
    vi.spyOn(Date, "now").mockImplementation(() => (now += 1000));

    await createStoredBoardSet(
      makeBoardSetInput({
        id: "old",
        name: "Old",
        rootBoardId: "root-1",
      }),
    );
    await createStoredBoardSet(
      makeBoardSetInput({
        id: "new",
        name: "New",
        rootBoardId: "root-1",
      }),
    );

    const sets = await listStoredBoardSets();
    expect(sets).toHaveLength(2);
    expect(sets[0].id).toBe("new");
    expect(sets[1].id).toBe("old");
  });
});

describe("deleteStoredBoardSet", () => {
  test("deletes the set and all its content while preserving another set", async () => {
    await createStoredBoardSet(
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

    await createStoredBoardSet(
      makeBoardSetInput({
        id: "set-2",
        name: "Set 2",
        rootBoardId: "b1",
        boards: [makeOBFBoard({ id: "b1", name: "Survivor" })],
        assets: [{ path: "img1.png", blob: new Blob(["survivor"]) }],
      }),
    );

    await deleteStoredBoardSet("set-1");

    const sets = await listStoredBoardSets();
    expect(sets.map((set) => set.id)).toEqual(["set-2"]);
    expect(await getBoardRecord("set-1", "b1")).toBeUndefined();
    expect(await getBoardRecord("set-1", "b2")).toBeUndefined();
    expect(await getAssetBlob("set-1", "img1.png")).toBeUndefined();
    expect(await getAssetBlob("set-1", "img2.png")).toBeUndefined();

    expect(await getBoardRecord("set-2", "b1")).toMatchObject({
      name: "Survivor",
    });
    const asset = await getAssetBlob("set-2", "img1.png");
    assertDefined(asset);
    expect(await asset.text()).toBe("survivor");
  });

  test("rejects empty boardSetId", async () => {
    await expect(deleteStoredBoardSet("")).rejects.toThrow(
      "Invalid boardSetId",
    );
  });
});
