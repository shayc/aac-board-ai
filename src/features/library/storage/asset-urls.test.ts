import { assertDefined } from "@shared/testing/assert-defined";
import { beforeEach, describe, expect, test } from "vitest";
import { addBoardSet, deleteBoardSet } from "../board-sets/board-sets-store";
import { makeAssetInput, makeBoardSetInput, resetBoardsDB } from "../testing";
import { findAssetKey, getAssetURL } from "./asset-urls";

const SET_ID = "asset-url-set";
const ASSET_PATH = "notes/hello.txt";

function seedAsset(content: string, boardSetId = SET_ID): Promise<void> {
  return addBoardSet(
    makeBoardSetInput({
      id: boardSetId,
      assets: [makeAssetInput(ASSET_PATH, content)],
    }),
  );
}

async function readAssetURL(url: string): Promise<string> {
  const response = await fetch(url);

  return response.text();
}

async function requireAssetURL(boardSetId: string): Promise<string> {
  const url = await getAssetURL({ boardSetId, path: ASSET_PATH });
  assertDefined(url);

  return url;
}

describe("asset URLs", () => {
  beforeEach(resetBoardsDB);

  test("returns one URL per stored asset", async () => {
    await seedAsset("hello");

    const [first, concurrent] = await Promise.all([
      requireAssetURL(SET_ID),
      requireAssetURL(SET_ID),
    ]);

    expect(concurrent).toBe(first);
    expect(await requireAssetURL(SET_ID)).toBe(first);
    expect(
      await getAssetURL({ boardSetId: SET_ID, path: `/${ASSET_PATH}` }),
    ).toBe(first);
    expect(await readAssetURL(first)).toBe("hello");
  });

  test("keeps the same path in different board sets separate", async () => {
    await seedAsset("first");
    await seedAsset("second", "other-set");

    expect(await readAssetURL(await requireAssetURL(SET_ID))).toBe("first");
    expect(await readAssetURL(await requireAssetURL("other-set"))).toBe(
      "second",
    );
  });

  test("returns nothing for a missing asset", async () => {
    await seedAsset("hello");

    await expect(
      getAssetURL({ boardSetId: SET_ID, path: "missing.txt" }),
    ).resolves.toBeUndefined();
  });

  test("revokes only the deleted board set's URLs", async () => {
    await seedAsset("deleted");
    await seedAsset("kept", "kept-set");
    const deletedURL = await requireAssetURL(SET_ID);
    const keptURL = await requireAssetURL("kept-set");

    await deleteBoardSet(SET_ID);

    await expect(fetch(deletedURL)).rejects.toThrow();
    expect(await readAssetURL(keptURL)).toBe("kept");
  });

  test("serves new content when a deleted board set ID is reused", async () => {
    await seedAsset("old");
    await requireAssetURL(SET_ID);

    await deleteBoardSet(SET_ID);
    await seedAsset("new");

    expect(await readAssetURL(await requireAssetURL(SET_ID))).toBe("new");
  });

  test("finds the stored asset behind a URL", async () => {
    await seedAsset("hello");
    const url = await requireAssetURL(SET_ID);

    expect(findAssetKey(url)).toEqual({ boardSetId: SET_ID, path: ASSET_PATH });
    expect(findAssetKey("https://example.com/hello.txt")).toBeUndefined();
  });

  test("forgets the assets of a deleted board set", async () => {
    await seedAsset("deleted");
    const url = await requireAssetURL(SET_ID);

    await deleteBoardSet(SET_ID);

    expect(findAssetKey(url)).toBeUndefined();
  });
});
