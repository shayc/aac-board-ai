import { describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useLastNonNull } from "./use-last-non-null";

interface Props {
  value: string | null;
}

function renderLastNonNull(initialValue: string | null) {
  return renderHook(
    ({ value }: Props = { value: initialValue }) => useLastNonNull(value),
    { initialProps: { value: initialValue } },
  );
}

describe("useLastNonNull", () => {
  test("is null until a value is given", async () => {
    const { result } = await renderLastNonNull(null);

    expect(result.current).toBeNull();
  });

  test("keeps the last value after it becomes null", async () => {
    const { result, rerender } = await renderLastNonNull("first");

    await rerender({ value: null });

    expect(result.current).toBe("first");
  });

  test("follows each new value", async () => {
    const { result, rerender } = await renderLastNonNull("first");

    await rerender({ value: null });
    await rerender({ value: "second" });

    expect(result.current).toBe("second");
  });
});
