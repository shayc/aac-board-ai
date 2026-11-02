import { assertDefined } from "@shared/testing/assert-defined";
import { beforeEach, describe, expect, test } from "vitest";
import { createBoardSet, deleteBoardSet } from "../board-sets/board-sets-store";
import { makeBoardSetInput, resetBoardsDB } from "../testing";
import { getAssetUrl } from "./asset-urls";

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

async function readAssetUrl(url: string): Promise<string> {
  const response = await fetch(url);

  return response.text();
}

async function requireAssetUrl(boardSetId: string): Promise<string> {
  const url = await getAssetUrl(boardSetId, ASSET_PATH);
  assertDefined(url);

  return url;
}

describe("asset URLs", () => {
  beforeEach(resetBoardsDB);

  test("returns one URL per stored asset", async () => {
    await seedAsset("hello");

    const [first, concurrent] = await Promise.all([
      requireAssetUrl(SET_ID),
      requireAssetUrl(SET_ID),
    ]);

    expect(concurrent).toBe(first);
    expect(await requireAssetUrl(SET_ID)).toBe(first);
    expect(await getAssetUrl(SET_ID, `/${ASSET_PATH}`)).toBe(first);
    expect(await readAssetUrl(first)).toBe("hello");
  });

  test("keeps the same path in different board sets separate", async () => {
    await seedAsset("first");
    await seedAsset("second", "other-set");

    expect(await readAssetUrl(await requireAssetUrl(SET_ID))).toBe("first");
    expect(await readAssetUrl(await requireAssetUrl("other-set"))).toBe(
      "second",
    );
  });

  test("returns nothing for a missing asset", async () => {
    await seedAsset("hello");

    await expect(getAssetUrl(SET_ID, "missing.txt")).resolves.toBeUndefined();
  });

  test("revokes URLs when their board set is deleted", async () => {
    await seedAsset("hello");
    const url = await requireAssetUrl(SET_ID);

    await deleteBoardSet(SET_ID);

    await expect(fetch(url)).rejects.toThrow();
  });

  test("serves new content when a deleted board set ID is reused", async () => {
    await seedAsset("old");
    await requireAssetUrl(SET_ID);

    await deleteBoardSet(SET_ID);
    await seedAsset("new");

    expect(await readAssetUrl(await requireAssetUrl(SET_ID))).toBe("new");
  });
});
