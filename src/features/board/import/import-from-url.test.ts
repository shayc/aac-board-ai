import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { listBoardSets } from "../storage/boards-db";
import { makeOBFBoard, resetBoardsDB } from "../testing";
import { importBoardFromUrl } from "./import-from-url";
import {
  BoardFileTooLargeError,
  MAX_BOARD_FILE_BYTES,
  UnsupportedBoardUrlError,
} from "./import-limits";

const SAMPLE_BOARDS_DIR = "/src/features/board/testing/sample-boards";
const OBZ_FIXTURE = "lots-of-stuff.obz";

describe("importBoardFromUrl", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test.each([
    "data:text/plain;base64,Zm9v",
    "javascript:alert(1)",
    "blob:https://example.com/00000000-0000-0000-0000-000000000000",
  ])("rejects the unsupported URL scheme in %s", async (url) => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(importBoardFromUrl(url)).rejects.toThrow(
      UnsupportedBoardUrlError,
    );

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(await listBoardSets()).toHaveLength(0);
  });

  test("rejects without reading the body when Content-Length exceeds the limit", async () => {
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(1024));
      },
    });
    const response = new Response(stream, {
      headers: { "content-length": String(MAX_BOARD_FILE_BYTES + 1) },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(response);

    await expect(
      importBoardFromUrl("https://example.com/huge.obz"),
    ).rejects.toThrow(BoardFileTooLargeError);

    // The body's ReadableStream is only ever locked by calling getReader() —
    // still unlocked here proves our code never touched it.
    expect(response.body?.locked).toBe(false);
    expect(await listBoardSets()).toHaveLength(0);
  });

  test("aborts mid-stream when a response with no Content-Length exceeds the limit", async () => {
    const chunkSize = 8 * 1024 * 1024;
    let pulls = 0;
    const endlessStream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        controller.enqueue(new Uint8Array(chunkSize));
      },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(endlessStream),
    );

    await expect(
      importBoardFromUrl("https://example.com/endless.obz"),
    ).rejects.toThrow(BoardFileTooLargeError);

    expect(pulls).toBeLessThan(25);
    expect(await listBoardSets()).toHaveLength(0);
  });

  test("imports a board from a URL", async () => {
    const result = await importBoardFromUrl(
      `${SAMPLE_BOARDS_DIR}/${OBZ_FIXTURE}`,
    );

    expect(result.alreadyExisted).toBe(false);
    expect(result.rootBoardId).toBeTruthy();

    const boardSets = await listBoardSets();
    expect(boardSets).toHaveLength(1);
  });

  test("uses the URL's filename as a fallback board-set name", async () => {
    const namelessBoard = makeOBFBoard({ name: undefined });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(namelessBoard), {
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await importBoardFromUrl("https://example.com/my-board.obf");

    const boardSets = await listBoardSets();
    expect(boardSets.find((set) => set.setId === result.setId)?.name).toBe(
      "my-board.obf",
    );
  });

  test("throws on HTTP error responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 404 }),
    );

    await expect(
      importBoardFromUrl("https://example.com/missing.obz"),
    ).rejects.toThrow("Failed to fetch board: HTTP 404");
  });
});
