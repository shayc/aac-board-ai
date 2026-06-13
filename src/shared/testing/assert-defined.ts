import { expect } from "vitest";

export function assertDefined<T>(
  value: T | undefined | null,
): asserts value is T {
  expect(value).toBeDefined();
  expect(value).not.toBeNull();
}
