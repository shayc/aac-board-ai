import type { UnzipLimits } from "@shayc/open-board-format";

// Real boards reach ~70 MB; headroom, not open-ended.
export const MAX_BOARD_FILE_BYTES = 150 * 1024 * 1024;

export const BOARD_UNZIP_LIMITS = {
  maxEntrySize: MAX_BOARD_FILE_BYTES,
  // Board media is already-compressed PNG/JPEG/MP3 — real inflation is ~1x.
  maxTotalOriginalSize: 500 * 1024 * 1024,
  maxEntries: 10_000,
} satisfies UnzipLimits;

export class BoardFileTooLargeError extends Error {
  constructor() {
    super(`Board file exceeds the ${MAX_BOARD_FILE_BYTES} byte limit`);
    this.name = "BoardFileTooLargeError";
  }
}

export class UnsupportedBoardUrlError extends Error {
  constructor(url: string) {
    super(`Unsupported board URL scheme: ${url}`);
    this.name = "UnsupportedBoardUrlError";
  }
}
