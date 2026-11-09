import { describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useLatestAsync } from "./use-latest-async";

describe("useLatestAsync", () => {
  test("stands down while run is undefined and starts once it is provided", async () => {
    const run = vi.fn(() => Promise.resolve("value"));
    const { result, rerender } = await renderHook(
      ({ isReady }: { isReady: boolean } = { isReady: false }) =>
        useLatestAsync({ deps: ["a"], run: isReady ? run : undefined }),
      { initialProps: { isReady: false } },
    );

    expect(result.current.value).toBeUndefined();
    expect(result.current.isPending).toBe(false);
    expect(run).not.toHaveBeenCalled();

    await rerender({ isReady: true });

    await vi.waitFor(() => expect(result.current.value).toBe("value"));
    expect(run).toHaveBeenCalledTimes(1);
  });

  test("runs with an empty deps list", async () => {
    const run = vi.fn(() => Promise.resolve("once"));

    const { result } = await renderHook(() =>
      useLatestAsync({ deps: [], run }),
    );

    await vi.waitFor(() => expect(result.current.value).toBe("once"));
    expect(run).toHaveBeenCalledTimes(1);
  });

  test("is pending from mount until it resolves", async () => {
    const resolvers: ((value: string) => void)[] = [];
    const { result } = await renderHook(() =>
      useLatestAsync({
        deps: ["a"],
        run: () => new Promise<string>((resolve) => resolvers.push(resolve)),
      }),
    );

    expect(result.current.isPending).toBe(true);
    expect(result.current.value).toBeUndefined();

    await vi.waitFor(() => expect(resolvers).toHaveLength(1));
    resolvers[0]?.("value-a");

    await vi.waitFor(() => {
      expect(result.current.value).toBe("value-a");
      expect(result.current.isPending).toBe(false);
    });
  });

  test("clears the previous value and stays pending until the new deps resolve", async () => {
    const resolvers: ((value: string) => void)[] = [];
    const { result, rerender } = await renderHook(
      ({ id }: { id: string } = { id: "a" }) =>
        useLatestAsync({
          deps: [id],
          run: () => new Promise<string>((resolve) => resolvers.push(resolve)),
        }),
      { initialProps: { id: "a" } },
    );

    await vi.waitFor(() => expect(resolvers).toHaveLength(1));
    resolvers[0]?.("value-a");
    await vi.waitFor(() => {
      expect(result.current.value).toBe("value-a");
      expect(result.current.isPending).toBe(false);
    });

    await rerender({ id: "b" });
    expect(result.current.isPending).toBe(true);
    expect(result.current.value).toBeUndefined();

    await vi.waitFor(() => expect(resolvers).toHaveLength(2));
    resolvers[1]?.("value-b");

    await vi.waitFor(() => {
      expect(result.current.value).toBe("value-b");
      expect(result.current.isPending).toBe(false);
    });
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

  test("exposes a rejection, clears the error on new deps, and recovers on success", async () => {
    const { result, rerender } = await renderHook(
      ({ id }: { id: string } = { id: "a" }) =>
        useLatestAsync({
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
      expect(result.current.value).toBeUndefined();
      expect(result.current.isPending).toBe(false);
    });

    await rerender({ id: "b" });
    expect(result.current.error).toBeUndefined();

    await vi.waitFor(() => {
      expect(result.current.value).toBe("good round");
      expect(result.current.error).toBeUndefined();
      expect(result.current.isPending).toBe(false);
    });
  });

  test("ignores a stale in-flight result that resolves after deps moved on", async () => {
    const resolvers = new Map<string, (value: string) => void>();
    const { result, rerender } = await renderHook(
      ({ id }: { id: string } = { id: "a" }) =>
        useLatestAsync({
          deps: [id],
          run: () =>
            new Promise<string>((resolve) => resolvers.set(id, resolve)),
        }),
      { initialProps: { id: "a" } },
    );

    await vi.waitFor(() => expect(resolvers.has("a")).toBe(true));
    await rerender({ id: "b" });
    await vi.waitFor(() => expect(resolvers.has("b")).toBe(true));

    resolvers.get("b")?.("value-b");
    resolvers.get("a")?.("value-a");

    await vi.waitFor(() => expect(result.current.value).toBe("value-b"));
  });

  test("ignores a stale in-flight rejection that settles after deps moved on", async () => {
    const requests = new Map<string, PromiseWithResolvers<string>>();
    const { result, rerender } = await renderHook(
      ({ id }: { id: string } = { id: "a" }) =>
        useLatestAsync({
          deps: [id],
          run: () => {
            const request = Promise.withResolvers<string>();
            requests.set(id, request);

            return request.promise;
          },
        }),
      { initialProps: { id: "a" } },
    );

    await vi.waitFor(() => expect(requests.has("a")).toBe(true));
    await rerender({ id: "b" });
    await vi.waitFor(() => expect(requests.has("b")).toBe(true));

    requests.get("b")?.resolve("value-b");
    requests.get("a")?.reject(new Error("stale failure"));

    await vi.waitFor(() => {
      expect(result.current.value).toBe("value-b");
      expect(result.current.error).toBeUndefined();
      expect(result.current.isPending).toBe(false);
    });
  });
});
