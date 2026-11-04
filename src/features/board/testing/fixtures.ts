import type { OBFBoard } from "@shayc/open-board-format";
import type {
  BoardSetInput,
  BoardSetRecord,
} from "../storage/board-set-storage";

export const TEST_IMAGE_SRC =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const SAMPLE_BOARDS_DIR = "/src/features/board/testing/sample-boards";

export function makeOBFBoard(overrides: Partial<OBFBoard> = {}): OBFBoard {
  return {
    format: "open-board-0.1",
    id: "board-1",
    locale: "en",
    name: "Test Board",
    buttons: [],
    grid: { rows: 1, columns: 1, order: [[null]] },
    images: [],
    sounds: [],
    ...overrides,
  };
}

export function makeBoardSetInput(
  overrides: Partial<BoardSetInput> = {},
): BoardSetInput {
  const boards = overrides.boards ?? [makeOBFBoard({ id: "root-1" })];

  return {
    id: "set-1",
    name: "Set",
    rootBoardId: boards[0]?.id ?? "root-1",
    boards,
    assets: [],
    ...overrides,
  };
}

export function makeBoardSetRecord(
  overrides: Partial<BoardSetRecord> = {},
): BoardSetRecord {
  return {
    id: "set-1",
    name: "My Board",
    rootBoardId: "root",
    updatedAt: 0,
    boardCount: 1,
    ...overrides,
  };
}

export async function loadTestImageBlob(): Promise<Blob> {
  const response = await fetch(TEST_IMAGE_SRC);

  return response.blob();
}

export async function loadFixtureFile(name: string): Promise<File> {
  const response = await fetch(`${SAMPLE_BOARDS_DIR}/${name}`);

  if (!response.ok) {
    throw new Error(`Failed to load test fixture: ${response.status}`);
  }

  const blob = await response.blob();

  return new File([blob], name, {
    type: blob.type || "application/octet-stream",
  });
}
