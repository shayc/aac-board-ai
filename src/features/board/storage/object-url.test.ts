import type { MockInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createObjectUrlRegistry } from "./object-url";

describe("createObjectUrlRegistry", () => {
  let revokeSpy: MockInstance<typeof URL.revokeObjectURL>;

  beforeEach(() => {
    revokeSpy = vi.spyOn(URL, "revokeObjectURL");
  });

  afterEach(() => {
    revokeSpy.mockRestore();
  });

  test("create returns a blob: URL", () => {
    const registry = createObjectUrlRegistry();
    const blob = new Blob(["hello"], { type: "text/plain" });

    const url = registry.create(blob);

    expect(url).toMatch(/^blob:/);
  });

  test("revokeAll revokes all created URLs", () => {
    const registry = createObjectUrlRegistry();

    const blob1 = new Blob(["a"]);
    const blob2 = new Blob(["b"]);
    const url1 = registry.create(blob1);
    const url2 = registry.create(blob2);

    registry.revokeAll();

    expect(revokeSpy).toHaveBeenCalledTimes(2);
    expect(revokeSpy).toHaveBeenCalledWith(url1);
    expect(revokeSpy).toHaveBeenCalledWith(url2);
  });

  test("revokeAll clears tracked URLs so double-call is safe", () => {
    const registry = createObjectUrlRegistry();
    registry.create(new Blob(["x"]));

    registry.revokeAll();
    registry.revokeAll();

    expect(revokeSpy).toHaveBeenCalledTimes(1);
  });
});
