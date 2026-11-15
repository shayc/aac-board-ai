import { TEST_IMAGE_SRC } from "@shared/testing/test-image";
import { type OBFBoard, zip } from "@shayc/open-board-format";
import { BOARD_FILE_IMPORT_LIMITS } from "../import/board-file-import";
import type {
  AssetInput,
  BoardSetInput,
  BoardSetRecord,
} from "../storage/board-set-storage";

const SAMPLE_BOARDS_DIR = "/src/features/library/testing/sample-boards";

export const SAMPLE_OBF_FILE = "lots-of-stuff.obf";
export const SAMPLE_OBZ_FILE = "lots-of-stuff.obz";
export const SAMPLE_OBZ_URL = `${SAMPLE_BOARDS_DIR}/${SAMPLE_OBZ_FILE}`;
// Imports name a board set after its file.
export const SAMPLE_BOARD_SET_ID = "lots-of-stuff";

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
    importedAt: 0,
    boardCount: 1,
    ...overrides,
  };
}

export function makeAssetInput(
  path: string,
  text: string,
  type = "",
): AssetInput {
  return { path, bytes: new TextEncoder().encode(text), type };
}

export async function loadTestImageAsset(path: string): Promise<AssetInput> {
  const response = await fetch(TEST_IMAGE_SRC);

  return { path, bytes: await response.bytes(), type: "image/png" };
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

export function makeCorruptBoardFile(name: string): File {
  return new File(["not valid json"], name, { type: "application/json" });
}

// Zeros keep the fixture small while exceeding the uncompressed-size limit.
export async function makeOversizedOBZ(name: string): Promise<File> {
  const oversized = new Uint8Array(BOARD_FILE_IMPORT_LIMITS.maxEntrySize! + 1);
  const zipped = await zip(new Map([["big.bin", oversized]]));

  return new File([zipped], name, { type: "application/octet-stream" });
}
