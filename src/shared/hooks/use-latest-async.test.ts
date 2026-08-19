import { describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useLatestAsync } from "./use-latest-async";

describe("useLatestAsync", () => {
  test("stands down without running when not enabled", async () => {
    const run = vi.fn(() => Promise.resolve("value"));

    const { result } = await renderHook(() =>
      useLatestAsync({ enabled: false, deps: ["a"], run }),
    );

    expect(result.current.value).toBeUndefined();
    expect(result.current.isPending).toBe(false);
    expect(run).not.toHaveBeenCalled();
  });

  test("runs when enabled even with an empty deps list", async () => {
    const run = vi.fn(() => Promise.resolve("once"));

    const { result } = await renderHook(() =>
      useLatestAsync({ enabled: true, deps: [], run }),
    );

    await vi.waitFor(() => expect(result.current.value).toBe("once"));
    expect(run).toHaveBeenCalledTimes(1);
  });

  test("is pending from mount until it resolves", async () => {
    const pending: ((value: string) => void)[] = [];
    const { result } = await renderHook(() =>
      useLatestAsync({
        enabled: true,
        deps: ["a"],
        run: () => new Promise<string>((r) => pending.push(r)),
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
          run: () => new Promise<string>((r) => pending.push(r)),
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

  test("starts a new round for dependency tuples that join to the same string", async () => {
    interface TestProps {
      deps: readonly (string | number | boolean)[];
      label: string;
    }

    const firstProps: TestProps = {
      deps: ["a\0b", "c"],
      label: "first",
    };
    const run = vi.fn((label: string) => Promise.resolve(label));
    const { result, rerender } = await renderHook(
      ({ deps, label }: TestProps = firstProps) =>
        useLatestAsync({
          enabled: true,
          deps,
          run: () => run(label),
        }),
      { initialProps: firstProps },
    );

    await vi.waitFor(() => expect(result.current.value).toBe("first"));

    await rerender({ deps: ["a", "b\0c"], label: "second" });

    await vi.waitFor(() => expect(result.current.value).toBe("second"));
    expect(run).toHaveBeenCalledTimes(2);
  });

  test("hides the previous value the instant deps change, until the next resolves", async () => {
    const pending: ((value: string) => void)[] = [];
    const { result, rerender } = await renderHook(
      ({ id }: { id: string } = { id: "a" }) =>
        useLatestAsync({
          enabled: true,
          deps: [id],
          run: () => new Promise<string>((r) => pending.push(r)),
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

  test("exposes a non-abort rejection as error state", async () => {
    const { result } = await renderHook(() =>
      useLatestAsync({
        enabled: true,
        deps: ["a"],
        run: () => Promise.reject(new Error("model exploded")),
      }),
    );

    await vi.waitFor(() => {
      expect(result.current.error?.message).toBe("model exploded");
    });
    expect(result.current.value).toBeUndefined();
    expect(result.current.isPending).toBe(false);
  });

  test("clears the error the instant deps change, and recovers on success", async () => {
    const { result, rerender } = await renderHook(
      ({ id }: { id: string } = { id: "a" }) =>
        useLatestAsync({
          enabled: true,
          deps: [id],
          run: () =>
            id === "a"
              ? Promise.reject(new Error("bad round"))
              : Promise.resolve("good round"),
        }),
      { initialProps: { id: "a" } },
    );

    await vi.waitFor(() => {
      expect(result.current.error?.message).toBe("bad round");
    });

    await rerender({ id: "b" });
    expect(result.current.error).toBeUndefined();

    await vi.waitFor(() => {
      expect(result.current.value).toBe("good round");
    });
    expect(result.current.error).toBeUndefined();
  });

  test("stays silent when the rejection comes from its own abort", async () => {
    const { result, rerender } = await renderHook(
      ({ enabled }: { enabled: boolean } = { enabled: true }) =>
        useLatestAsync({
          enabled,
          deps: ["a"],
          run: (signal) =>
            new Promise<string>((_resolve, reject) => {
              signal.addEventListener("abort", () => {
                reject(new DOMException("Aborted", "AbortError"));
              });
            }),
        }),
      { initialProps: { enabled: true } },
    );

    await rerender({ enabled: false });

    expect(result.current.error).toBeUndefined();
    expect(result.current.value).toBeUndefined();
  });

  test("ignores a stale in-flight result that resolves after deps moved on", async () => {
    const pending = new Map<string, (value: string) => void>();
    const { result, rerender } = await renderHook(
      ({ id }: { id: string } = { id: "a" }) =>
        useLatestAsync({
          enabled: true,
          deps: [id],
          run: () => new Promise<string>((r) => pending.set(id, r)),
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
