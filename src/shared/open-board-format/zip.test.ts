import { describe, expect, test } from "vitest";
import { isZip, unzip, zip } from "./zip";

const ZIP_MAGIC_BYTES = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);

describe("isZip", () => {
  test("returns true for valid ZIP magic bytes", () => {
    const validZip = ZIP_MAGIC_BYTES.buffer;

    expect(isZip(validZip)).toBe(true);
  });

  test("returns false for non-ZIP data", () => {
    const notZip = new Uint8Array([0x00, 0x00, 0x00, 0x00]).buffer;

    expect(isZip(notZip)).toBe(false);
  });

  test("returns false for buffer too short", () => {
    const tooShort = new Uint8Array([0x50]).buffer;

    expect(isZip(tooShort)).toBe(false);
  });
});

describe("zip", () => {
  test("creates valid ZIP archive", async () => {
    const testContent = new TextEncoder().encode("test file content");
    const files = new Map<string, Uint8Array>([["test.txt", testContent]]);

    const zipped = await zip(files);

    expect(isZip(zipped.buffer as ArrayBuffer)).toBe(true);
    expect(zipped.byteLength).toBeGreaterThan(0);
  });
});

describe("unzip", () => {
  test("extracts files from ZIP archive", async () => {
    const testContent = new TextEncoder().encode("test file content");
    const files = new Map<string, Uint8Array>([["test.txt", testContent]]);
    const zipped = await zip(files);

    const unzipped = await unzip(zipped.buffer as ArrayBuffer);

    expect(unzipped.size).toBe(1);
    expect(new TextDecoder().decode(unzipped.get("test.txt"))).toBe(
      "test file content",
    );
  });
});

describe("Integration: zip and unzip", () => {
  test("round-trip preserves file contents", async () => {
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
});
