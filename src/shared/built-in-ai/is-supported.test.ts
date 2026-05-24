import { describe, expect, test, vi } from "vitest";
import { isSupported } from "./is-supported";

describe("isSupported", () => {
  test("returns true when the global namespace exists", () => {
    vi.stubGlobal("Translator", {
      availability: vi.fn(),
      create: vi.fn(),
    });
    expect(isSupported("Translator")).toBe(true);
  });

  test("returns false when the global namespace is absent", () => {
    vi.stubGlobal("Translator", undefined);
    expect(isSupported("Translator")).toBe(false);
  });
});
