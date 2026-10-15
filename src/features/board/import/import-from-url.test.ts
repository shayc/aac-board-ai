import { beforeEach, describe, expect, test, vi } from "vitest";
import { loadFixtureFile, resetBoardsDB } from "../testing";
import {
  importBoardSetFromUrl,
  MAX_BOARD_DOWNLOAD_BYTES,
} from "./import-from-url";

const SAMPLE_BOARDS_DIR = "/src/features/board/testing/sample-boards";
const OBZ_FIXTURE = "lots-of-stuff.obz";

describe("importBoardSetFromUrl", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("imports a board from a URL and derives the setId from the filename", async () => {
    const result = await importBoardSetFromUrl(
      `${SAMPLE_BOARDS_DIR}/${OBZ_FIXTURE}`,
    );

    expect(result.id).toBe("lots-of-stuff");
    expect(result.rootBoardId).toBeTruthy();
  });

  test("keeps both sets when URL imports share a filename", async () => {
    const first = await importBoardSetFromUrl(
      `${SAMPLE_BOARDS_DIR}/${OBZ_FIXTURE}`,
    );
    const second = await importBoardSetFromUrl(
      `${SAMPLE_BOARDS_DIR}/${OBZ_FIXTURE}`,
    );

    expect(first.id).toBe("lots-of-stuff");
    expect(second.id).toBe("lots-of-stuff-2");
  });

  test("derives the setId from the last non-empty segment when the URL path ends with a slash", async () => {
    const fixtureFile = await loadFixtureFile(OBZ_FIXTURE);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(fixtureFile));

    const result = await importBoardSetFromUrl("https://example.com/boards/");

    expect(result.id).toBe("boards");
  });

  test("falls back to the default filename when the URL has no path segments", async () => {
    const fixtureFile = await loadFixtureFile(OBZ_FIXTURE);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(fixtureFile));

    const result = await importBoardSetFromUrl("https://example.com/");

    expect(result.id).toBe("board");
  });

  test("throws on HTTP error responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 404 }),
    );

    await expect(
      importBoardSetFromUrl("https://example.com/missing.obz"),
    ).rejects.toThrow("Failed to fetch board: HTTP 404");
  });

  test("rejects a non-http(s) URL before fetching", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(
      importBoardSetFromUrl("data:application/zip;base64,UEsDBA=="),
    ).rejects.toMatchObject({
      name: "BoardUrlError",
      code: "unsupported-scheme",
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("cancels a download that exceeds the size cap instead of buffering it", async () => {
    let cancelled = false;
    const endlessBody = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(MAX_BOARD_DOWNLOAD_BYTES / 4));
      },
      cancel() {
        cancelled = true;
      },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(endlessBody));

    await expect(
      importBoardSetFromUrl("https://example.com/huge.obz"),
    ).rejects.toMatchObject({
      name: "BoardUrlError",
      code: "download-too-large",
    });

    expect(cancelled).toBe(true);
  });
});
