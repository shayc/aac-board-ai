import { describe, expect, test, vi } from "vitest";
import { createObjectUrlRegistry } from "./object-url";

describe("createObjectUrlRegistry", () => {
  test("create returns a blob: URL", () => {
    const registry = createObjectUrlRegistry();
    const blob = new Blob(["hello"], { type: "text/plain" });

    const url = registry.create(blob);

    expect(url).toMatch(/^blob:/);
  });

  test("revokeAll revokes all created URLs", () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");
    const registry = createObjectUrlRegistry();

    const blob1 = new Blob(["a"]);
    const blob2 = new Blob(["b"]);
    const url1 = registry.create(blob1);
    const url2 = registry.create(blob2);

    registry.revokeAll();

    expect(revokeSpy).toHaveBeenCalledTimes(2);
    expect(revokeSpy).toHaveBeenCalledWith(url1);
    expect(revokeSpy).toHaveBeenCalledWith(url2);

    revokeSpy.mockRestore();
  });

  test("revokeAll is safe to call when empty", () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");
    const registry = createObjectUrlRegistry();

    registry.revokeAll();

    expect(revokeSpy).not.toHaveBeenCalled();

    revokeSpy.mockRestore();
  });

  test("revokeAll clears tracked URLs so double-call is safe", () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");
    const registry = createObjectUrlRegistry();
    registry.create(new Blob(["x"]));

    registry.revokeAll();
    registry.revokeAll();

    expect(revokeSpy).toHaveBeenCalledTimes(1);

    revokeSpy.mockRestore();
  });
});
