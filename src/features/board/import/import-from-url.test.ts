import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { resetBoardsDB } from "../storage/test-utils";
import { importBoardFromUrl } from "./import-from-url";

const SAMPLE_BOARDS_DIR = "/src/shared/testing/sample-boards";
const OBZ_FIXTURE = "lots-of-stuff.obz";

async function loadFixtureBlob(name: string): Promise<Blob> {
  const response = await fetch(`${SAMPLE_BOARDS_DIR}/${name}`);

  if (!response.ok) {
    throw new Error(`Failed to load test fixture: ${response.status}`);
  }

  return response.blob();
}

describe("importBoardFromUrl", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("imports a board from a URL and derives the setId from the filename", async () => {
    const result = await importBoardFromUrl(
      `${SAMPLE_BOARDS_DIR}/${OBZ_FIXTURE}`,
    );

    expect(result.setId).toBe("lots-of-stuff");
    expect(result.rootBoardId).toBeTruthy();
  });

  test("derives the setId from the last non-empty segment when the URL path ends with a slash", async () => {
    const fixtureBlob = await loadFixtureBlob(OBZ_FIXTURE);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(fixtureBlob));

    const result = await importBoardFromUrl("https://example.com/boards/");

    expect(result.setId).toBe("boards");
  });

  test("falls back to the default filename when the URL has no path segments", async () => {
    const fixtureBlob = await loadFixtureBlob(OBZ_FIXTURE);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(fixtureBlob));

    const result = await importBoardFromUrl("https://example.com/");

    expect(result.setId).toBe("board");
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
