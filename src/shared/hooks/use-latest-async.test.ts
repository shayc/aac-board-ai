import { describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useLatestAsync } from "./use-latest-async";

describe("useLatestAsync", () => {
  test("returns the value once the fetch resolves", async () => {
    const { result } = await renderHook(() =>
      useLatestAsync({
        enabled: true,
        deps: ["a"],
        fetch: () => Promise.resolve("value-a"),
      }),
    );

    await vi.waitFor(() => expect(result.current.value).toBe("value-a"));
  });

  test("stands down without fetching when not enabled", async () => {
    const fetch = vi.fn(() => Promise.resolve("value"));

    const { result } = await renderHook(() =>
      useLatestAsync({ enabled: false, deps: ["a"], fetch }),
    );

    expect(result.current.value).toBeUndefined();
    expect(result.current.isPending).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("fetches when enabled even with an empty deps list", async () => {
    const fetch = vi.fn(() => Promise.resolve("once"));

    const { result } = await renderHook(() =>
      useLatestAsync({ enabled: true, deps: [], fetch }),
    );

    await vi.waitFor(() => expect(result.current.value).toBe("once"));
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test("is pending from mount until the fetch resolves", async () => {
    const pending: ((value: string) => void)[] = [];
    const { result } = await renderHook(() =>
      useLatestAsync({
        enabled: true,
        deps: ["a"],
        fetch: () => new Promise<string>((r) => pending.push(r)),
      }),
    );

    expect(result.current.isPending).toBe(true);
    expect(result.current.value).toBeUndefined();

    await vi.waitFor(() => expect(pending).toHaveLength(1));
    pending[0]("value-a");

    await vi.waitFor(() => {
      expect(result.current.value).toBe("value-a");
      expect(result.current.isPending).toBe(false);
    });
  });

  test("returns to pending the instant deps change, until the next resolves", async () => {
    const pending: ((value: string) => void)[] = [];
    const { result, rerender } = await renderHook(
      ({ id }: { id: string } = { id: "a" }) =>
        useLatestAsync({
          enabled: true,
          deps: [id],
          fetch: () => new Promise<string>((r) => pending.push(r)),
        }),
      { initialProps: { id: "a" } },
    );

    await vi.waitFor(() => expect(pending).toHaveLength(1));
    pending[0]("value-a");
    await vi.waitFor(() => expect(result.current.isPending).toBe(false));

    await rerender({ id: "b" });
    expect(result.current.isPending).toBe(true);
    expect(result.current.value).toBeUndefined();
  });

  test("hides the previous value the instant deps change, until the next resolves", async () => {
    const pending: ((value: string) => void)[] = [];
    const { result, rerender } = await renderHook(
      ({ id }: { id: string } = { id: "a" }) =>
        useLatestAsync({
          enabled: true,
          deps: [id],
          fetch: () => new Promise<string>((r) => pending.push(r)),
        }),
      { initialProps: { id: "a" } },
    );

    await vi.waitFor(() => expect(pending).toHaveLength(1));
    pending[0]("value-a");
    await vi.waitFor(() => expect(result.current.value).toBe("value-a"));

    await rerender({ id: "b" });
    expect(result.current.value).toBeUndefined();

    await vi.waitFor(() => expect(pending).toHaveLength(2));
    pending[1]("value-b");
    await vi.waitFor(() => expect(result.current.value).toBe("value-b"));
  });

  test("ignores a stale in-flight result that resolves after deps moved on", async () => {
    const pending = new Map<string, (value: string) => void>();
    const { result, rerender } = await renderHook(
      ({ id }: { id: string } = { id: "a" }) =>
        useLatestAsync({
          enabled: true,
          deps: [id],
          fetch: () => new Promise<string>((r) => pending.set(id, r)),
        }),
      { initialProps: { id: "a" } },
    );

    await vi.waitFor(() => expect(pending.has("a")).toBe(true));
    await rerender({ id: "b" });
    await vi.waitFor(() => expect(pending.has("b")).toBe(true));

    pending.get("b")?.("value-b");
    pending.get("a")?.("value-a");

    await vi.waitFor(() => expect(result.current.value).toBe("value-b"));
  });
});
