import { beforeEach, describe, expect, test, vi } from "vitest";
import { listBoardSetRecords } from "../storage/board-set-storage";
import {
  loadFixtureFile,
  resetBoardsDB,
  SAMPLE_BOARD_SET_ID,
  SAMPLE_OBZ_FILE,
  SAMPLE_OBZ_URL,
} from "../testing";
import {
  importBoardFileFromURL,
  MAX_BOARD_DOWNLOAD_BYTES,
} from "./import-from-url";

function opaqueRedirectResponse(): Response {
  const response = new Response(null);
  Object.defineProperties(response, {
    type: { value: "opaqueredirect" },
    status: { value: 0 },
    ok: { value: false },
  });

  return response;
}

describe("importBoardFileFromURL", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("imports a board from a URL and derives the boardSetId from the filename", async () => {
    const result = await importBoardFileFromURL(SAMPLE_OBZ_URL);

    expect(result.id).toBe(SAMPLE_BOARD_SET_ID);
    expect(result.rootBoardId).toBeTruthy();
  });

  test("aborts an in-flight download without importing a board set", async () => {
    const controller = new AbortController();
    const importing = importBoardFileFromURL(SAMPLE_OBZ_URL, {
      signal: controller.signal,
    });

    controller.abort();

    await expect(importing).rejects.toMatchObject({ name: "AbortError" });
    expect(await listBoardSetRecords()).toEqual([]);
  });

  test("does not start importing if cancellation races with a completed download", async () => {
    const fixtureFile = await loadFixtureFile(SAMPLE_OBZ_FILE);
    const controller = new AbortController();
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      controller.abort();

      return new Response(fixtureFile);
    });

    await expect(
      importBoardFileFromURL(SAMPLE_OBZ_URL, {
        signal: controller.signal,
      }),
    ).rejects.toBe(controller.signal.reason);
    expect(await listBoardSetRecords()).toEqual([]);
  });

  test("derives the boardSetId from the last non-empty segment when the URL path ends with a slash", async () => {
    const fixtureFile = await loadFixtureFile(SAMPLE_OBZ_FILE);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(fixtureFile));

    const result = await importBoardFileFromURL("https://example.com/boards/");

    expect(result.id).toBe("boards");
  });

  test("falls back to the default filename when the URL has no path segments", async () => {
    const fixtureFile = await loadFixtureFile(SAMPLE_OBZ_FILE);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(fixtureFile));

    const result = await importBoardFileFromURL("https://example.com/");

    expect(result.id).toBe("board");
  });

  test("decodes a percent-encoded filename when deriving the boardSetId", async () => {
    const fixtureFile = await loadFixtureFile(SAMPLE_OBZ_FILE);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(fixtureFile));

    const result = await importBoardFileFromURL(
      "https://example.com/My%20Board.obz",
    );

    expect(result.id).toBe("my board");
  });

  test("keeps a malformed percent escape as typed", async () => {
    const fixtureFile = await loadFixtureFile(SAMPLE_OBZ_FILE);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(fixtureFile));

    const result = await importBoardFileFromURL(
      "https://example.com/50%E0.obz",
    );

    expect(result.id).toBe("50%e0");
  });

  test("rejects with the HTTP status when the download fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 404 }),
    );

    await expect(
      importBoardFileFromURL("https://example.com/missing.obz"),
    ).rejects.toThrow("Failed to fetch board: HTTP 404");
  });

  test("rejects a redirecting URL without following it or importing", async () => {
    const fixtureFile = await loadFixtureFile(SAMPLE_OBZ_FILE);
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) =>
      init?.redirect === "manual"
        ? opaqueRedirectResponse()
        : new Response(fixtureFile),
    );

    await expect(
      importBoardFileFromURL("https://trusted.example/go?to=core.obz"),
    ).rejects.toMatchObject({
      name: "BoardFileURLError",
      code: "redirect",
    });
    expect(await listBoardSetRecords()).toEqual([]);
  });

  test.each([
    "data:application/zip;base64,UEsDBA==",
    `blob:${window.location.origin}/00000000-0000-0000-0000-000000000000`,
    "http://trusted.example/core.obz",
  ])("rejects %s before fetching", async (url) => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(importBoardFileFromURL(url)).rejects.toMatchObject({
      name: "BoardFileURLError",
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
      importBoardFileFromURL("https://example.com/huge.obz"),
    ).rejects.toMatchObject({
      name: "BoardFileURLError",
      code: "download-too-large",
    });

    expect(cancelled).toBe(true);
  });

  test("rejects a download whose declared size exceeds the cap without reading it", async () => {
    let pulled = false;
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>(
      {
        pull() {
          pulled = true;
        },
        cancel() {
          cancelled = true;
        },
      },
      { highWaterMark: 0 },
    );
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(body, {
        headers: { "content-length": String(MAX_BOARD_DOWNLOAD_BYTES + 1) },
      }),
    );

    await expect(
      importBoardFileFromURL("https://example.com/huge.obz"),
    ).rejects.toMatchObject({
      name: "BoardFileURLError",
      code: "download-too-large",
    });

    expect(pulled).toBe(false);
    expect(cancelled).toBe(true);
  });

  test("reports download progress against the content length", async () => {
    const fixtureFile = await loadFixtureFile(SAMPLE_OBZ_FILE);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(fixtureFile, {
        headers: { "content-length": String(fixtureFile.size) },
      }),
    );
    const onProgress = vi.fn();

    await importBoardFileFromURL(SAMPLE_OBZ_URL, {
      onProgress,
    });

    expect(onProgress).toHaveBeenNthCalledWith(1, {
      loaded: 0,
      total: fixtureFile.size,
    });
    expect(onProgress).toHaveBeenLastCalledWith({
      loaded: fixtureFile.size,
      total: fixtureFile.size,
    });
  });

  test("leaves the progress total unknown for a compressed response", async () => {
    const fixtureFile = await loadFixtureFile(SAMPLE_OBZ_FILE);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(fixtureFile, {
        headers: { "content-length": "100", "content-encoding": "gzip" },
      }),
    );
    const onProgress = vi.fn();

    await importBoardFileFromURL(SAMPLE_OBZ_URL, {
      onProgress,
    });

    expect(onProgress).toHaveBeenLastCalledWith({
      loaded: fixtureFile.size,
      total: undefined,
    });
  });
});
