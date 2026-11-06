import { assertDefined } from "@shared/testing/assert-defined";
import { beforeEach, describe, expect, test } from "vitest";
import { createBoardSet, deleteBoardSet } from "../board-sets/board-sets-store";
import { makeBoardSetInput, resetBoardsDB } from "../testing";
import { getAssetURL } from "./asset-urls";

const SET_ID = "asset-url-set";
const ASSET_PATH = "notes/hello.txt";

function seedAsset(content: string, boardSetId = SET_ID): Promise<void> {
  return createBoardSet(
    makeBoardSetInput({
      id: boardSetId,
      assets: [{ path: ASSET_PATH, blob: new Blob([content]) }],
    }),
  );
}

async function readAssetURL(url: string): Promise<string> {
  const response = await fetch(url);

  return response.text();
}

async function requireAssetURL(boardSetId: string): Promise<string> {
  const url = await getAssetURL(boardSetId, ASSET_PATH);
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
    expect(await getAssetURL(SET_ID, `/${ASSET_PATH}`)).toBe(first);
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

    await expect(getAssetURL(SET_ID, "missing.txt")).resolves.toBeUndefined();
  });

  test("revokes URLs when their board set is deleted", async () => {
    await seedAsset("hello");
    const url = await requireAssetURL(SET_ID);

    await deleteBoardSet(SET_ID);

    await expect(fetch(url)).rejects.toThrow();
  });

  test("serves new content when a deleted board set ID is reused", async () => {
    await seedAsset("old");
    await requireAssetURL(SET_ID);

    await deleteBoardSet(SET_ID);
    await seedAsset("new");

    expect(await readAssetURL(await requireAssetURL(SET_ID))).toBe("new");
  });
});
