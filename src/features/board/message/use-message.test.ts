import { describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useMessage } from "./use-message";

describe("useMessage", () => {
  test("builds text from multiple parts joined by spaces", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.addPart({ label: "I" });
    await rerender();
    result.current.addPart({ label: "want" });
    await rerender();
    result.current.addPart({ label: "water" });
    await rerender();

    expect(result.current.parts).toHaveLength(3);
    expect(result.current.text).toBe("I want water");
  });

  test("mints a distinct id for each part even with identical content", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.addPart({ label: "cat" });
    await rerender();
    result.current.addPart({ label: "cat" });
    await rerender();

    const [first, second] = result.current.parts;
    expect(first.id).toBeTruthy();
    expect(second.id).toBeTruthy();
    expect(first.id).not.toBe(second.id);
  });

  test("appends text to the last part without mangling its id", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.addPart({ label: "ca", imageSrc: "img.png" });
    await rerender();

    const partId = result.current.parts[0].id;

    result.current.appendText("t");
    await rerender();

    expect(result.current.parts).toHaveLength(1);
    expect(result.current.parts[0].id).toBe(partId);
    expect(result.current.parts[0].label).toBe("cat");
    expect(result.current.parts[0].imageSrc).toBe("img.png");
  });

  test("appends text as a new part when the message is empty", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.appendText("h");
    await rerender();

    expect(result.current.parts).toHaveLength(1);
    expect(result.current.parts[0].label).toBe("h");
    expect(result.current.parts[0].id).toBeTruthy();
  });

  test("accumulates rapid appends into a single part", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.addPart({ label: "" });
    await rerender();

    const partId = result.current.parts[0].id;

    result.current.appendText("h");
    result.current.appendText("i");
    await rerender();

    expect(result.current.parts).toHaveLength(1);
    expect(result.current.parts[0].id).toBe(partId);
    expect(result.current.parts[0].label).toBe("hi");
  });

  test("removes the last-added part", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.addPart({ label: "hello" });
    await rerender();
    result.current.addPart({ label: "world" });
    await rerender();

    result.current.removeLastPart();
    await rerender();

    expect(result.current.parts).toHaveLength(1);
    expect(result.current.text).toBe("hello");
  });

  test("splits a text string into individual word parts", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.setFromText("I want water");
    await rerender();

    expect(result.current.parts).toHaveLength(3);
    expect(result.current.text).toBe("I want water");
  });

  test("segments scripts without whitespace into word parts", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.setFromText("我想喝水");
    await rerender();

    expect(result.current.parts.length).toBeGreaterThan(1);
    expect(
      result.current.parts.every((part) => (part.label?.length ?? 0) > 0),
    ).toBe(true);
  });

  test("clears all existing parts when called with an empty string", async () => {
    const { result, rerender } = await renderHook(() => useMessage());

    result.current.addPart({ label: "existing" });
    await rerender();

    result.current.setFromText("");
    await rerender();

    expect(result.current.parts).toHaveLength(0);
  });
});
