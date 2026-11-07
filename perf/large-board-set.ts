import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { crc32, deflateSync } from "node:zlib";
import { createOBZ, type OBFBoard } from "@shayc/open-board-format";
import { RESULTS_DIR } from "./harness.ts";

export const LARGE_BOARD_SET_FILE = path.join(
  RESULTS_DIR,
  "fixtures",
  "large-board-set.obz",
);
export const LARGE_ROOT_BOARD = { id: "large-home", name: "Large set home" };

const ROWS = 8;
const COLUMNS = 10;
const CATEGORY_COUNT = ROWS * COLUMNS - 1;
const IMAGE_COUNT = 400;
const IMAGE_SIZE = 48;

/**
 * Writes a synthetic OBZ: one home board linking to 79 category boards, 80
 * tiles each, sharing 400 small PNG symbols. The content is the same on every
 * run, so imports stay comparable across runs.
 */
export async function writeLargeBoardSet(): Promise<string> {
  const categoryIds = Array.from(
    { length: CATEGORY_COUNT },
    (_, index) => `category-${index + 1}`,
  );
  const boards = [
    buildBoard({ ...LARGE_ROOT_BOARD, links: categoryIds }, 0),
    ...categoryIds.map((id, index) =>
      buildBoard({ id, name: `Large set ${index + 1}`, links: [] }, index + 1),
    ),
  ];
  const images = new Map(
    Array.from({ length: IMAGE_COUNT }, (_, index) => [
      imagePath(`image-${index}`),
      buildPNG(index),
    ]),
  );

  const archive = await createOBZ(boards, LARGE_ROOT_BOARD.id, images);
  await mkdir(path.dirname(LARGE_BOARD_SET_FILE), { recursive: true });
  await writeFile(LARGE_BOARD_SET_FILE, await archive.bytes());

  return LARGE_BOARD_SET_FILE;
}

function imagePath(imageId: string): string {
  return `images/${imageId}.png`;
}

function buildBoard(
  board: { id: string; name: string; links: string[] },
  boardIndex: number,
): OBFBoard {
  const buttons = Array.from({ length: ROWS * COLUMNS }, (_, index) => {
    const imageIndex = (boardIndex * ROWS * COLUMNS + index) % IMAGE_COUNT;
    const linkedBoardId = board.links[index];

    return {
      id: `${board.id}-${index}`,
      label: linkedBoardId ? `go ${index + 1}` : `word ${boardIndex}-${index}`,
      image_id: `image-${imageIndex}`,
      background_color: `rgb(255, ${200 + (index % 50)}, 170)`,
      ...(linkedBoardId && { load_board: { id: linkedBoardId } }),
    };
  });
  const usedImageIds = [...new Set(buttons.map(({ image_id }) => image_id))];

  return {
    format: "open-board-0.1",
    id: board.id,
    locale: "en",
    name: board.name,
    grid: {
      rows: ROWS,
      columns: COLUMNS,
      order: Array.from({ length: ROWS }, (_, row) =>
        buttons.slice(row * COLUMNS, (row + 1) * COLUMNS).map(({ id }) => id),
      ),
    },
    buttons,
    images: usedImageIds.map((id) => ({
      id,
      path: imagePath(id),
      content_type: "image/png",
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
    })),
  };
}

function buildPNG(index: number): Buffer {
  const color = [(index * 37) % 256, (index * 91) % 256, (index * 53) % 256];
  const row = Buffer.alloc(1 + IMAGE_SIZE * 3);
  for (let x = 0; x < IMAGE_SIZE; x += 1) {
    row.set(x < IMAGE_SIZE / 2 ? color : [255, 255, 255], 1 + x * 3);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(IMAGE_SIZE, 0);
  header.writeUInt32BE(IMAGE_SIZE, 4);
  header.set([8, 2], 8);

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(Buffer.concat(Array(IMAGE_SIZE).fill(row)))),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type), data]);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(typeAndData));

  return Buffer.concat([length, typeAndData, checksum]);
}
