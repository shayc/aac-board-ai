import { describe, it, expect, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useAsyncOperation } from "./useAsyncOperation";

describe("useAsyncOperation", () => {
  it("should start with idle status", async () => {
    const fn = vi.fn().mockResolvedValue("result");
    const { result } = await renderHook(() => useAsyncOperation(fn));

    expect(result.current.status).toBe("idle");
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should transition to success status with data", async () => {
    const fn = vi.fn().mockResolvedValue("success data");
    const { result } = await renderHook(() => useAsyncOperation(fn));

    await result.current.run("arg1");

    // Wait for the promise to resolve
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(result.current.status).toBe("success");
    expect(result.current.data).toBe("success data");
    expect(result.current.error).toBeNull();
  });

  it("should transition to error status with error", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("test error"));
    const { result } = await renderHook(() => useAsyncOperation(fn));

    await result.current.run("arg1");

    // Wait for the promise to reject
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(result.current.status).toBe("error");
    expect(result.current.data).toBeNull();
    expect(result.current.error?.message).toBe("test error");
  });

  it("should pass AbortSignal to function", async () => {
    const fn = vi.fn().mockResolvedValue("result");
    const { result } = await renderHook(() => useAsyncOperation(fn));

    await result.current.run("arg1", "arg2");

    // Wait for completion
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(fn).toHaveBeenCalledWith(expect.any(AbortSignal), "arg1", "arg2");
  });

  it("should cancel operation and reset to idle", async () => {
    const fn = vi.fn().mockImplementation(
      () =>
        new Promise(() => {
          // Never resolves
        }),
    );
    const { result } = await renderHook(() => useAsyncOperation(fn));

    void result.current.run("arg1");

    // Wait for status to change to running
    await new Promise((resolve) => setTimeout(resolve, 10));

    result.current.cancel();

    // Wait a bit for the cancel to take effect
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(result.current.status).toBe("idle");
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should handle non-Error thrown values", async () => {
    const fn = vi.fn().mockRejectedValue("string error");
    const { result } = await renderHook(() => useAsyncOperation(fn));

    await result.current.run("arg1");

    // Wait for the promise to reject
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(result.current.status).toBe("error");
    expect(result.current.error?.message).toBe("string error");
  });
});
