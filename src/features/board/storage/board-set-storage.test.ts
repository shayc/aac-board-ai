import { assertDefined } from "@shared/testing/assert-defined";
import type { OBFBoard } from "@shayc/open-board-format";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { makeOBFBoard, resetBoardsDB } from "../testing";
import { getAssetBlob, getBoard } from "./board-content-storage";
import {
  BoardSetAlreadyExistsError,
  createBoardSet,
  deleteBoardSet,
  listBoardSets,
  type BoardSetCreateInput,
} from "./board-set-storage";
import { closeBoardsDB, InvalidIdError } from "./boards-db";

function makeBoardSetInput(
  overrides: Partial<BoardSetCreateInput> = {},
): BoardSetCreateInput {
  return {
    boardSet: { setId: "set-1", name: "Set", rootBoardId: "root-1" },
    boards: [],
    assets: [],
    ...overrides,
  };
}

beforeEach(async () => {
  await resetBoardsDB();
});

afterEach(closeBoardsDB);

describe("createBoardSet", () => {
  test("rejects a conflicting ID without changing the existing set", async () => {
    await createBoardSet(
      makeBoardSetInput({
        boardSet: { setId: "set-1", name: "Original", rootBoardId: "a" },
        boards: [{ boardId: "a", name: "A", obf: makeOBFBoard({ id: "a" }) }],
        assets: [{ path: "x.png", blob: new Blob(["x"]) }],
      }),
    );

    await expect(
      createBoardSet(
        makeBoardSetInput({
          boardSet: {
            setId: "set-1",
            name: "Replacement",
            rootBoardId: "b",
          },
          boards: [{ boardId: "b", name: "B", obf: makeOBFBoard({ id: "b" }) }],
          assets: [],
        }),
      ),
    ).rejects.toBeInstanceOf(BoardSetAlreadyExistsError);

    expect(await getBoard("set-1", "a")).toBeDefined();
    expect(await getBoard("set-1", "b")).toBeUndefined();
    expect(await getAssetBlob("set-1", "x.png")).toBeInstanceOf(Blob);
    expect((await listBoardSets())[0]?.name).toBe("Original");
  });

  test("inserts a new board set", async () => {
    await createBoardSet(
      makeBoardSetInput({
        boardSet: { setId: "set-1", name: "My Set", rootBoardId: "root-1" },
      }),
    );

    const sets = await listBoardSets();
    expect(sets).toHaveLength(1);
    expect(sets[0].setId).toBe("set-1");
    expect(sets[0].name).toBe("My Set");
    expect(sets[0].boardCount).toBe(0);
  });

  test("counts boards from the boards array, not a recount", async () => {
    const boards = [
      { boardId: "b1", name: "B1", obf: makeOBFBoard({ id: "b1" }) },
      { boardId: "b2", name: "B2", obf: makeOBFBoard({ id: "b2" }) },
      { boardId: "b3", name: "B3", obf: makeOBFBoard({ id: "b3" }) },
    ];

    await createBoardSet(makeBoardSetInput({ boards }));

    const sets = await listBoardSets();
    expect(sets[0].boardCount).toBe(3);

    const board = await getBoard("set-1", "b2");
    assertDefined(board);
    expect(board.name).toBe("B2");
  });

  test("aborts the entire transaction when a board fails to clone", async () => {
    const uncloneableObf = {
      ...makeOBFBoard({ id: "b" }),
      onFail: () => "noop",
    } as unknown as OBFBoard;

    await expect(
      createBoardSet(
        makeBoardSetInput({
          boards: [{ boardId: "b", name: "B", obf: uncloneableObf }],
          assets: [{ path: "x.png", blob: new Blob(["x"]) }],
        }),
      ),
    ).rejects.toThrow();

    expect(await listBoardSets()).toEqual([]);
    expect(await getBoard("set-1", "b")).toBeUndefined();
    expect(await getAssetBlob("set-1", "x.png")).toBeUndefined();
  });

  test("rejects empty setId with a typed InvalidIdError", async () => {
    await expect(
      createBoardSet(
        makeBoardSetInput({
          boardSet: { setId: "", name: "Bad", rootBoardId: "root-1" },
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidIdError);
  });

  test("rejects setId longer than 255 characters", async () => {
    await expect(
      createBoardSet(
        makeBoardSetInput({
          boardSet: {
            setId: "x".repeat(256),
            name: "Bad",
            rootBoardId: "root-1",
          },
        }),
      ),
    ).rejects.toThrow("Invalid setId");
  });

  test("rejects empty rootBoardId", async () => {
    await expect(
      createBoardSet(
        makeBoardSetInput({
          boardSet: { setId: "set-1", name: "Bad", rootBoardId: "" },
        }),
      ),
    ).rejects.toThrow("Invalid rootBoardId");
  });

  test("rejects empty boardId", async () => {
    await expect(
      createBoardSet(
        makeBoardSetInput({
          boards: [{ boardId: "", name: "B", obf: makeOBFBoard() }],
        }),
      ),
    ).rejects.toThrow("Invalid boardId");
  });

  test("rejects boardId longer than 255 characters", async () => {
    await expect(
      createBoardSet(
        makeBoardSetInput({
          boards: [
            { boardId: "x".repeat(256), name: "B", obf: makeOBFBoard() },
          ],
        }),
      ),
    ).rejects.toThrow("Invalid boardId");
  });
});

describe("listBoardSets", () => {
  test("returns empty array when no sets exist", async () => {
    const sets = await listBoardSets();
    expect(sets).toEqual([]);
  });

  test("returns sets sorted by updatedAt descending", async () => {
    let now = 1000;
    vi.spyOn(Date, "now").mockImplementation(() => (now += 1000));

    await createBoardSet(
      makeBoardSetInput({
        boardSet: { setId: "old", name: "Old", rootBoardId: "root-1" },
      }),
    );
    await createBoardSet(
      makeBoardSetInput({
        boardSet: { setId: "new", name: "New", rootBoardId: "root-1" },
      }),
    );

    const sets = await listBoardSets();
    expect(sets).toHaveLength(2);
    expect(sets[0].setId).toBe("new");
    expect(sets[1].setId).toBe("old");
  });
});

describe("deleteBoardSet", () => {
  test("removes the board set record", async () => {
    await createBoardSet(makeBoardSetInput());

    await deleteBoardSet("set-1");

    const sets = await listBoardSets();
    expect(sets).toHaveLength(0);
  });

  test("cascade-deletes all boards in the set", async () => {
    await createBoardSet(
      makeBoardSetInput({
        boards: [
          { boardId: "b1", name: "B1", obf: makeOBFBoard({ id: "b1" }) },
          { boardId: "b2", name: "B2", obf: makeOBFBoard({ id: "b2" }) },
        ],
      }),
    );

    await deleteBoardSet("set-1");

    expect(await getBoard("set-1", "b1")).toBeUndefined();
    expect(await getBoard("set-1", "b2")).toBeUndefined();
  });

  test("cascade-deletes all assets in the set", async () => {
    await createBoardSet(
      makeBoardSetInput({
        assets: [
          { path: "img1.png", blob: new Blob(["a"]) },
          { path: "img2.png", blob: new Blob(["b"]) },
        ],
      }),
    );

    await deleteBoardSet("set-1");

    expect(await getAssetBlob("set-1", "img1.png")).toBeUndefined();
    expect(await getAssetBlob("set-1", "img2.png")).toBeUndefined();
  });

  test("does not affect other board sets", async () => {
    await createBoardSet(
      makeBoardSetInput({
        boardSet: { setId: "set-1", name: "Set 1", rootBoardId: "root-1" },
        boards: [
          { boardId: "b1", name: "B1", obf: makeOBFBoard({ id: "b1" }) },
        ],
      }),
    );
    await createBoardSet(
      makeBoardSetInput({
        boardSet: { setId: "set-2", name: "Set 2", rootBoardId: "root-1" },
        boards: [
          { boardId: "b2", name: "B2", obf: makeOBFBoard({ id: "b2" }) },
        ],
      }),
    );

    await deleteBoardSet("set-1");

    const sets = await listBoardSets();
    expect(sets).toHaveLength(1);
    expect(sets[0].setId).toBe("set-2");

    const board = await getBoard("set-2", "b2");
    expect(board).toBeDefined();
  });

  test("rejects empty setId", async () => {
    await expect(deleteBoardSet("")).rejects.toThrow("Invalid setId");
  });
});
