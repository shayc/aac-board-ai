import { afterEach, describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useMessage } from "./useMessage";

const STORAGE_KEY = "message";

afterEach(() => {
  localStorage.removeItem(STORAGE_KEY);
});

describe("useMessage", () => {
  describe("addPart", () => {
    test("adds a part to an empty message", async () => {
      const { result, rerender } = await renderHook(() => useMessage());

      result.current.addPart({ id: "1", label: "hello" });
      await rerender();

      expect(result.current.parts).toHaveLength(1);
      expect(result.current.parts[0]).toEqual({ id: "1", label: "hello" });
      expect(result.current.text).toBe("hello");
    });

    test("adds multiple parts and joins labels with spaces", async () => {
      const { result, rerender } = await renderHook(() => useMessage());

      result.current.addPart({ id: "1", label: "I" });
      await rerender();
      result.current.addPart({ id: "2", label: "want" });
      await rerender();
      result.current.addPart({ id: "3", label: "water" });
      await rerender();

      expect(result.current.parts).toHaveLength(3);
      expect(result.current.text).toBe("I want water");
    });
  });

  describe("removeLastPart", () => {
    test("removes the last part", async () => {
      const { result, rerender } = await renderHook(() => useMessage());

      result.current.addPart({ id: "1", label: "hello" });
      await rerender();
      result.current.addPart({ id: "2", label: "world" });
      await rerender();

      result.current.removeLastPart();
      await rerender();

      expect(result.current.parts).toHaveLength(1);
      expect(result.current.parts[0].id).toBe("1");
    });
  });

  describe("updateLastPart", () => {
    test("merges into the existing last part", async () => {
      const { result, rerender } = await renderHook(() => useMessage());

      result.current.addPart({
        id: "1",
        label: "he",
        imageSrc: "img.png",
      });
      await rerender();

      result.current.updateLastPart({ id: "1", label: "hello" });
      await rerender();

      expect(result.current.parts).toHaveLength(1);
      expect(result.current.parts[0].label).toBe("hello");
      expect(result.current.parts[0].imageSrc).toBe("img.png");
    });

    test("inserts part as first element when empty", async () => {
      const { result, rerender } = await renderHook(() => useMessage());

      result.current.updateLastPart({ id: "1", label: "first" });
      await rerender();

      expect(result.current.parts).toHaveLength(1);
      expect(result.current.parts[0]).toEqual({ id: "1", label: "first" });
    });
  });

  describe("clear", () => {
    test("resets message to empty", async () => {
      const { result, rerender } = await renderHook(() => useMessage());

      result.current.addPart({ id: "1", label: "hello" });
      await rerender();

      result.current.clear();
      await rerender();

      expect(result.current.parts).toHaveLength(0);
      expect(result.current.text).toBe("");
    });
  });

  describe("addSpace", () => {
    test("adds a spacer part with empty label", async () => {
      const { result, rerender } = await renderHook(() => useMessage());

      result.current.addPart({ id: "1", label: "hello" });
      await rerender();
      result.current.addSpace();
      await rerender();
      result.current.addPart({ id: "2", label: "world" });
      await rerender();

      expect(result.current.parts).toHaveLength(3);
      expect(result.current.parts[1].label).toBe("");
      expect(result.current.parts[1].id).toBeTruthy();
    });
  });

  describe("setFromText", () => {
    test("splits text into word parts", async () => {
      const { result, rerender } = await renderHook(() => useMessage());

      result.current.setFromText("hello world");
      await rerender();

      expect(result.current.parts).toHaveLength(2);
      expect(result.current.parts[0].label).toBe("hello");
      expect(result.current.parts[1].label).toBe("world");
    });

    test("handles extra whitespace", async () => {
      const { result, rerender } = await renderHook(() => useMessage());

      result.current.setFromText("  hello   world  ");
      await rerender();

      expect(result.current.parts).toHaveLength(2);
      expect(result.current.parts[0].label).toBe("hello");
      expect(result.current.parts[1].label).toBe("world");
    });

    test("produces empty parts for empty string", async () => {
      const { result, rerender } = await renderHook(() => useMessage());

      result.current.addPart({ id: "1", label: "existing" });
      await rerender();

      result.current.setFromText("");
      await rerender();

      expect(result.current.parts).toHaveLength(0);
    });
  });
});
