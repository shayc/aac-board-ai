import { beforeEach, describe, expect, test } from "vitest";
import { measureOperation } from "./operations";
import { beginWindow, takeSnapshot } from "./perf-store";

function operationStats() {
  return takeSnapshot().operations.find(
    (operation) => operation.name === "op:board:load",
  );
}

describe("measureOperation", () => {
  beforeEach(() => {
    beginWindow();
  });

  test("returns the result and aggregates count, total and max", () => {
    const result = { board: "home" };

    expect(measureOperation("op:board:load", () => result)).toBe(result);
    measureOperation("op:board:load", () => undefined);

    expect(operationStats()).toMatchObject({ count: 2 });
    expect(operationStats()?.max).toBeLessThanOrEqual(
      operationStats()?.total ?? 0,
    );
  });

  test("rethrows the original error after recording", () => {
    const error = new Error("unreadable board");

    expect(() =>
      measureOperation("op:board:load", () => {
        throw error;
      }),
    ).toThrow(error);
    expect(operationStats()).toMatchObject({ count: 1 });
  });

  test("returns the same promise and records once it settles", async () => {
    const { promise, resolve } = Promise.withResolvers<string>();

    const measured = measureOperation("op:board:load", () => promise);

    expect(measured).toBe(promise);
    expect(operationStats()).toBeUndefined();

    resolve("loaded");
    await expect(measured).resolves.toBe("loaded");
    expect(operationStats()).toMatchObject({ count: 1 });
  });

  test("leaves a rejected promise's error for the caller", async () => {
    const error = new Error("quota exceeded");
    const rejected = Promise.reject(error);

    const measured = measureOperation("op:board:load", () => rejected);

    expect(measured).toBe(rejected);
    await expect(measured).rejects.toBe(error);
    expect(operationStats()).toMatchObject({ count: 1 });
  });
});
