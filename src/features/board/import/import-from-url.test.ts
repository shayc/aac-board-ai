import { beforeEach, describe, expect, test, vi } from "vitest";
import { listBoardSetRecords } from "../storage/board-set-storage";
import { loadFixtureFile, resetBoardsDB } from "../testing";
import {
  importBoardFileFromURL,
  MAX_BOARD_DOWNLOAD_BYTES,
} from "./import-from-url";

const SAMPLE_BOARDS_DIR = "/src/features/board/testing/sample-boards";
const OBZ_FIXTURE = "lots-of-stuff.obz";

// A constructed Response can't follow a redirect, so set where the fetch
// ended up the way the network would.
function redirectedResponse(body: BodyInit, finalURL: string): Response {
  const response = new Response(body);
  Object.defineProperties(response, {
    redirected: { value: true },
    url: { value: finalURL },
  });

  return response;
}

describe("importBoardFileFromURL", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("imports a board from a URL and derives the boardSetId from the filename", async () => {
    const result = await importBoardFileFromURL(
      `${SAMPLE_BOARDS_DIR}/${OBZ_FIXTURE}`,
    );

    expect(result.id).toBe("lots-of-stuff");
    expect(result.rootBoardId).toBeTruthy();
  });

  test("aborts an in-flight download without importing a board set", async () => {
    const controller = new AbortController();
    const importing = importBoardFileFromURL(
      `${SAMPLE_BOARDS_DIR}/${OBZ_FIXTURE}`,
      { signal: controller.signal },
    );

    controller.abort();

    await expect(importing).rejects.toBe(controller.signal.reason);
    expect(await listBoardSetRecords()).toEqual([]);
  });

  test("does not start importing if cancellation races with a completed download", async () => {
    const fixtureFile = await loadFixtureFile(OBZ_FIXTURE);
    const controller = new AbortController();
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      controller.abort();

      return new Response(fixtureFile);
    });

    await expect(
      importBoardFileFromURL(`${SAMPLE_BOARDS_DIR}/${OBZ_FIXTURE}`, {
        signal: controller.signal,
      }),
    ).rejects.toBe(controller.signal.reason);
    expect(await listBoardSetRecords()).toEqual([]);
  });

  test("derives the boardSetId from the last non-empty segment when the URL path ends with a slash", async () => {
    const fixtureFile = await loadFixtureFile(OBZ_FIXTURE);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(fixtureFile));

    const result = await importBoardFileFromURL("https://example.com/boards/");

    expect(result.id).toBe("boards");
  });

  test("falls back to the default filename when the URL has no path segments", async () => {
    const fixtureFile = await loadFixtureFile(OBZ_FIXTURE);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(fixtureFile));

    const result = await importBoardFileFromURL("https://example.com/");

    expect(result.id).toBe("board");
  });

  test("rejects with the HTTP status when the download fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 404 }),
    );

    await expect(
      importBoardFileFromURL("https://example.com/missing.obz"),
    ).rejects.toThrow("Failed to fetch board: HTTP 404");
  });

  test("rejects a download redirected to another host without importing", async () => {
    const fixtureFile = await loadFixtureFile(OBZ_FIXTURE);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      redirectedResponse(fixtureFile, "https://elsewhere.example/core.obz"),
    );

    await expect(
      importBoardFileFromURL("https://trusted.example/go?to=core.obz"),
    ).rejects.toMatchObject({
      name: "BoardURLError",
      code: "cross-host-redirect",
    });
    expect(await listBoardSetRecords()).toEqual([]);
  });

  test("follows a redirect that stays on the same host", async () => {
    const fixtureFile = await loadFixtureFile(OBZ_FIXTURE);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      redirectedResponse(fixtureFile, "https://trusted.example/v2/core.obz"),
    );

    const result = await importBoardFileFromURL(
      "http://trusted.example/core.obz",
    );

    expect(result.id).toBe("core");
  });

  test("rejects a non-http(s) URL before fetching", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(
      importBoardFileFromURL("data:application/zip;base64,UEsDBA=="),
    ).rejects.toMatchObject({
      name: "BoardURLError",
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
      name: "BoardURLError",
      code: "download-too-large",
    });

    expect(cancelled).toBe(true);
  });

  test("reports download progress against the content length", async () => {
    const fixtureFile = await loadFixtureFile(OBZ_FIXTURE);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(fixtureFile, {
        headers: { "content-length": String(fixtureFile.size) },
      }),
    );
    const onProgress = vi.fn();

    await importBoardFileFromURL(`${SAMPLE_BOARDS_DIR}/${OBZ_FIXTURE}`, {
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
    const fixtureFile = await loadFixtureFile(OBZ_FIXTURE);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(fixtureFile, {
        headers: { "content-length": "100", "content-encoding": "gzip" },
      }),
    );
    const onProgress = vi.fn();

    await importBoardFileFromURL(`${SAMPLE_BOARDS_DIR}/${OBZ_FIXTURE}`, {
      onProgress,
    });

    expect(onProgress).toHaveBeenLastCalledWith({
      loaded: fixtureFile.size,
      total: undefined,
    });
  });
});
