import { describe, expect, test } from "vitest";
import {
  appendPart,
  appendSpace,
  appendTextToLastPart,
  dropLastPart,
} from "./message-transforms";
import type { MessagePart } from "./use-message";

describe("appendPart", () => {
  test("appends a new part with a minted id", () => {
    const parts = appendPart([], { label: "hi" });

    expect(parts).toHaveLength(1);
    expect(parts[0].label).toBe("hi");
    expect(parts[0].id).toBeTruthy();
  });

  test("mints a distinct id for each part even with identical content", () => {
    const first = appendPart([], { label: "cat" });
    const second = appendPart(first, { label: "cat" });

    expect(second[0].id).not.toBe(second[1].id);
  });

  test("leaves the input array untouched", () => {
    const original: MessagePart[] = [{ id: "1", label: "hi" }];

    const result = appendPart(original, { label: "there" });

    expect(original).toHaveLength(1);
    expect(result).toHaveLength(2);
  });
});

describe("appendSpace", () => {
  test("appends an empty-label part", () => {
    const parts = appendSpace([{ id: "1", label: "hi" }]);

    expect(parts).toHaveLength(2);
    expect(parts[1].label).toBe("");
  });
});

describe("appendTextToLastPart", () => {
  test("appends text as a new part when the message is empty", () => {
    const parts = appendTextToLastPart([], "h");

    expect(parts).toHaveLength(1);
    expect(parts[0].label).toBe("h");
    expect(parts[0].id).toBeTruthy();
  });

  test("appends text to the last part without mangling its id or other content", () => {
    const original: MessagePart[] = [
      { id: "1", label: "ca", imageSrc: "img.png" },
    ];

    const parts = appendTextToLastPart(original, "t");

    expect(parts).toHaveLength(1);
    expect(parts[0].id).toBe("1");
    expect(parts[0].label).toBe("cat");
    expect(parts[0].imageSrc).toBe("img.png");
  });

  test("accumulates rapid appends into a single part", () => {
    const afterFirst = appendTextToLastPart([{ id: "1", label: "" }], "h");
    const afterSecond = appendTextToLastPart(afterFirst, "i");

    expect(afterSecond).toHaveLength(1);
    expect(afterSecond[0].id).toBe("1");
    expect(afterSecond[0].label).toBe("hi");
  });

  test("leaves the input array untouched", () => {
    const original: MessagePart[] = [{ id: "1", label: "ca" }];

    appendTextToLastPart(original, "t");

    expect(original[0].label).toBe("ca");
  });
});

describe("dropLastPart", () => {
  test("removes the last part", () => {
    const parts = dropLastPart([
      { id: "1", label: "hello" },
      { id: "2", label: "world" },
    ]);

    expect(parts).toEqual([{ id: "1", label: "hello" }]);
  });

  test("returns an empty array when there is only one part", () => {
    expect(dropLastPart([{ id: "1", label: "hi" }])).toEqual([]);
  });

  test("returns an empty array when already empty", () => {
    expect(dropLastPart([])).toEqual([]);
  });
});
