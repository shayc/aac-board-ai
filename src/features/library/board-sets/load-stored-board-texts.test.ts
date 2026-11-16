import { beforeEach, describe, expect, test } from "vitest";
import { insertBoardSetRecords } from "../storage/board-set-storage";
import { loadTestImageAsset, makeOBFBoard, resetBoardsDB } from "../testing";
import { loadStoredBoardTexts } from "./load-stored-board-texts";

const SET_ID = "texts-test-set";
const IMAGE_PATH = "images/test.png";

async function seedTestBoards(): Promise<void> {
  const image = await loadTestImageAsset(IMAGE_PATH);
  const eatBoard = makeOBFBoard({
    id: "eat",
    name: "Eat",
    grid: { rows: 1, columns: 1, order: [["bread"]] },
    buttons: [{ id: "bread", label: "bread", image_id: "img-1" }],
    images: [{ id: "img-1", path: IMAGE_PATH, content_type: "image/png" }],
  });

  await insertBoardSetRecords({
    id: SET_ID,
    name: "Texts Test",
    rootBoardId: "eat",
    boards: [eatBoard, { ...eatBoard, id: "go", name: "Go", images: [] }],
    assets: [image],
  });
}

describe("loadStoredBoardTexts", () => {
  beforeEach(async () => {
    await resetBoardsDB();
    await seedTestBoards();
  });

  test("reads the boards' text without resolving their pictures", async () => {
    const boards = await loadStoredBoardTexts(SET_ID, ["eat", "go"]);

    expect(boards.map((board) => board.name)).toEqual(["Eat", "Go"]);
    expect(boards[0]?.buttons).toMatchObject([{ label: "bread" }]);
    expect(boards[0]?.buttons[0]?.imageSrc).toBeUndefined();
  });

  test("leaves out boards that are not stored", async () => {
    const boards = await loadStoredBoardTexts(SET_ID, ["missing", "go"]);

    expect(boards.map((board) => board.id)).toEqual(["go"]);
  });
});
