import { afterEach, describe, expect, test } from "vitest";
import { hasUserActivation } from "./activation.ts";

afterEach(() => {
  delete (navigator as unknown as { userActivation?: unknown }).userActivation;
});

describe("hasUserActivation", () => {
  test("returns false when navigator.userActivation is absent", () => {
    Object.defineProperty(navigator, "userActivation", {
      value: undefined,
      configurable: true,
    });
    expect(hasUserActivation()).toBe(false);
  });

  test("returns true when navigator.userActivation.isActive is true", () => {
    Object.defineProperty(navigator, "userActivation", {
      value: { isActive: true },
      configurable: true,
    });
    expect(hasUserActivation()).toBe(true);
  });

  test("returns false when navigator.userActivation.isActive is false", () => {
    Object.defineProperty(navigator, "userActivation", {
      value: { isActive: false },
      configurable: true,
    });
    expect(hasUserActivation()).toBe(false);
  });
});
