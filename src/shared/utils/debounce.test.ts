import { describe, expect, test, vi } from "vitest";
import { debounce } from "./debounce";

describe("debounce", () => {
  test("delays the call until the wait elapses", () => {
    vi.useFakeTimers();
    try {
      const fn = vi.fn();
      const debounced = debounce(fn, 200);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(200);
      expect(fn).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  test("coalesces rapid calls into one, using the latest arguments", () => {
    vi.useFakeTimers();
    try {
      const fn = vi.fn<(value: string) => void>();
      const debounced = debounce(fn, 200);

      debounced("a");
      debounced("b");
      debounced("c");
      vi.advanceTimersByTime(200);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith("c");
    } finally {
      vi.useRealTimers();
    }
  });

  test("restarts the wait on each call", () => {
    vi.useFakeTimers();
    try {
      const fn = vi.fn();
      const debounced = debounce(fn, 200);

      debounced();
      vi.advanceTimersByTime(150);
      debounced();
      vi.advanceTimersByTime(150);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
