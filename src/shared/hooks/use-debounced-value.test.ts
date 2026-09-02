import { describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useDebouncedValue } from "./use-debounced-value";

const DELAY = 50;

describe("useDebouncedValue", () => {
  test("holds the previous value until the delay elapses, then updates", async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string } = { value: "a" }) =>
        useDebouncedValue(value, DELAY),
      { initialProps: { value: "a" } },
    );

    await rerender({ value: "b" });
    expect(result.current).toBe("a");

    await expect.poll(() => result.current).toBe("b");
  });

  test("collapses a burst of changes into the final value", async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string } = { value: "a" }) =>
        useDebouncedValue(value, DELAY),
      { initialProps: { value: "a" } },
    );

    await rerender({ value: "b" });
    await rerender({ value: "c" });
    expect(result.current).toBe("a");

    await expect.poll(() => result.current).toBe("c");
  });
});
