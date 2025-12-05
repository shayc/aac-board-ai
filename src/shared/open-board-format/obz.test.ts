import { expect, test } from "vitest";
import { createOBZ, extractOBZ, parseManifest } from "./obz";
import type { OBFBoard } from "./schema";

test("extractOBZ throws for non-ZIP input", async () => {
  const notZip = new ArrayBuffer(10);

  await expect(extractOBZ(notZip)).rejects.toThrow(
    "Invalid OBZ: not a ZIP file",
  );
});

test("extractOBZ throws for missing manifest.json", async () => {
  const { zip } = await import("./zip");
  const filesWithoutManifest = new Map([
    ["boards/test.obf", new TextEncoder().encode("{}")],
  ]);
  const zipBuffer = await zip(filesWithoutManifest);

  await expect(extractOBZ(zipBuffer.buffer as ArrayBuffer)).rejects.toThrow(
    "Invalid OBZ: missing manifest.json",
  );
});

test("parseManifest throws for invalid manifest format", () => {
  const invalidManifest = JSON.stringify({ format: "wrong-format" });

  expect(() => parseManifest(invalidManifest)).toThrow(/Invalid manifest/);
});

test("createOBZ and extractOBZ round-trip preserves boards", async () => {
  const board: OBFBoard = {
    format: "open-board-0.1",
    id: "board-1",
    buttons: [{ id: "btn-1", label: "Test" }],
    grid: { rows: 1, columns: 1, order: [["btn-1"]] },
  };

  const obzBlob = await createOBZ([board], "board-1");
  const obzBuffer = await obzBlob.arrayBuffer();
  const extracted = await extractOBZ(obzBuffer);

  expect(extracted.manifest.root).toBe("boards/board-1.obf");
  expect(extracted.boards.get("board-1")).toMatchObject({
    id: "board-1",
    buttons: [{ id: "btn-1", label: "Test" }],
  });
});
