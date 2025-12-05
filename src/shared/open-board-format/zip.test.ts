import { expect, test } from "vitest";
import { isZip, unzip, zip } from "./zip";

const ZIP_MAGIC_BYTES = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);

test("isZip identifies ZIP magic bytes correctly", () => {
  const validZip = ZIP_MAGIC_BYTES.buffer;
  const notZip = new Uint8Array([0x00, 0x00, 0x00, 0x00]).buffer;
  const tooShort = new Uint8Array([0x50]).buffer;

  expect(isZip(validZip)).toBe(true);
  expect(isZip(notZip)).toBe(false);
  expect(isZip(tooShort)).toBe(false);
});

test("zip and unzip round-trip preserves file contents", async () => {
  const testContent = new TextEncoder().encode("test file content");
  const files = new Map<string, Uint8Array>([
    ["folder/file.txt", testContent],
    ["root.json", new TextEncoder().encode('{"key":"value"}')],
  ]);

  const zipped = await zip(files);
  const unzipped = await unzip(zipped.buffer as ArrayBuffer);

  expect(new TextDecoder().decode(unzipped.get("folder/file.txt"))).toBe(
    "test file content",
  );
  expect(new TextDecoder().decode(unzipped.get("root.json"))).toBe(
    '{"key":"value"}',
  );
});
