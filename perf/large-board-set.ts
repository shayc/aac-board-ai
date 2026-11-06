import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { crc32, deflateRawSync, deflateSync } from "node:zlib";
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
const OBF_FORMAT = "open-board-0.1";

interface Entry {
  name: string;
  data: Buffer;
}

/**
 * Writes a synthetic OBZ: one home board linking to 79 category boards, 80
 * tiles each, sharing 400 small PNG symbols. The bytes are identical on
 * every run, so imports stay comparable across runs.
 */
export async function writeLargeBoardSet(): Promise<string> {
  const images = Array.from({ length: IMAGE_COUNT }, (_, index) => ({
    id: `image-${index}`,
    path: `images/image-${index}.png`,
  }));
  const boards = [
    { ...LARGE_ROOT_BOARD, links: categoryIds() },
    ...categoryIds().map((id, index) => ({
      id,
      name: `Large set ${index + 1}`,
      links: [],
    })),
  ];

  const entries: Entry[] = [
    jsonEntry("manifest.json", {
      format: OBF_FORMAT,
      root: boardPath(LARGE_ROOT_BOARD.id),
      paths: {
        boards: Object.fromEntries(boards.map(({ id }) => [id, boardPath(id)])),
        images: Object.fromEntries(images.map(({ id, path }) => [id, path])),
      },
    }),
    ...boards.map((board, boardIndex) =>
      jsonEntry(
        boardPath(board.id),
        buildBoard(
          board,
          boardIndex,
          images.map(({ id }) => id),
        ),
      ),
    ),
    ...images.map(({ path }, index) => ({ name: path, data: buildPNG(index) })),
  ];

  await mkdir(path.dirname(LARGE_BOARD_SET_FILE), { recursive: true });
  await writeFile(LARGE_BOARD_SET_FILE, zip(entries));

  return LARGE_BOARD_SET_FILE;
}

function categoryIds(): string[] {
  return Array.from(
    { length: CATEGORY_COUNT },
    (_, index) => `category-${index + 1}`,
  );
}

function boardPath(boardId: string): string {
  return `boards/${boardId}.obf`;
}

function buildBoard(
  board: { id: string; name: string; links: string[] },
  boardIndex: number,
  imageIds: string[],
): object {
  const buttons = Array.from({ length: ROWS * COLUMNS }, (_, index) => {
    const imageId =
      imageIds[(boardIndex * ROWS * COLUMNS + index) % IMAGE_COUNT];
    const linkedBoardId = board.links[index];

    return {
      id: `${board.id}-${index}`,
      label: linkedBoardId ? `go ${index + 1}` : `word ${boardIndex}-${index}`,
      image_id: imageId,
      background_color: `rgb(255, ${200 + (index % 50)}, 170)`,
      ...(linkedBoardId && {
        load_board: { id: linkedBoardId, path: boardPath(linkedBoardId) },
      }),
    };
  });
  const usedImageIds = [...new Set(buttons.map(({ image_id }) => image_id))];

  return {
    format: OBF_FORMAT,
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
      path: `images/${id}.png`,
      content_type: "image/png",
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
    })),
    sounds: [],
  };
}

function jsonEntry(name: string, value: object): Entry {
  return { name, data: Buffer.from(JSON.stringify(value)) };
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

// A minimal deflate ZIP writer with a fixed 1980-01-01 timestamp, so the
// archive bytes never change between runs.
function zip(entries: Entry[]): Buffer {
  const DOS_DATE = (1 << 5) | 1;
  const parts: Buffer[] = [];
  const directory: Buffer[] = [];
  let offset = 0;

  for (const { name, data } of entries) {
    const fileName = Buffer.from(name);
    const compressed = deflateRawSync(data);
    const checksum = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(fileName.length, 26);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(fileName.length, 28);
    central.writeUInt32LE(offset, 42);

    parts.push(local, fileName, compressed);
    directory.push(central, fileName);
    offset += local.length + fileName.length + compressed.length;
  }

  const directorySize = directory.reduce(
    (total, part) => total + part.length,
    0,
  );
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directorySize, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...parts, ...directory, end]);
}
