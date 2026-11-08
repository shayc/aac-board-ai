import { describe, expect, test } from "vitest";
import {
  appendPart,
  appendSpace,
  appendText,
  applyBackspace,
} from "./message-transforms";
import type { MessagePart } from "./message-types";

describe("appendPart", () => {
  test("appends a new part with a minted id", () => {
    const parts = appendPart([], { label: "hi", language: "en" });

    expect(parts).toHaveLength(1);
    expect(parts[0].label).toBe("hi");
    expect(parts[0].id).toBeTruthy();
  });

  test("mints a distinct id for each part even with identical content", () => {
    const first = appendPart([], { label: "cat", language: "en" });
    const second = appendPart(first, { label: "cat", language: "en" });

    expect(second[0].id).not.toBe(second[1].id);
  });

  test("leaves the input array untouched", () => {
    const original: MessagePart[] = [{ id: "1", label: "hi", language: "en" }];

    const result = appendPart(original, { label: "there", language: "en" });

    expect(original).toHaveLength(1);
    expect(result).toHaveLength(2);
  });
});

describe("appendSpace", () => {
  test("appends an empty-label part", () => {
    const parts = appendSpace([{ id: "1", label: "hi", language: "en" }], "en");

    expect(parts).toHaveLength(2);
    expect(parts[1].label).toBe("");
  });
});

describe("appendText", () => {
  test("appends text as a new part when the message is empty", () => {
    const parts = appendText([], "h", "en");

    expect(parts).toHaveLength(1);
    expect(parts[0].label).toBe("h");
    expect(parts[0].id).toBeTruthy();
  });

  test("appends text to a purely text-only last part", () => {
    const original: MessagePart[] = [{ id: "1", label: "ca", language: "en" }];

    const parts = appendText(original, "t", "en");

    expect(parts).toHaveLength(1);
    expect(parts[0].id).toBe("1");
    expect(parts[0].label).toBe("cat");
  });

  test("starts a new part if the last part has media", () => {
    const original: MessagePart[] = [
      { id: "1", label: "ca", language: "en", imageSrc: "img.png" },
    ];

    const parts = appendText(original, "t", "en");

    expect(parts).toHaveLength(2);
    expect(parts[1].label).toBe("t");
    expect(parts[0].imageSrc).toBe("img.png");
  });

  test("starts a new part if the last part is in another language", () => {
    const original: MessagePart[] = [{ id: "1", label: "ca", language: "en" }];

    const parts = appendText(original, "t", "es");

    expect(parts).toHaveLength(2);
    expect(parts[1]).toMatchObject({ label: "t", language: "es" });
  });

  test("accumulates rapid appends into a single part", () => {
    const afterFirst = appendText(
      [{ id: "1", label: "", language: "en" }],
      "h",
      "en",
    );
    const afterSecond = appendText(afterFirst, "i", "en");

    expect(afterSecond).toHaveLength(1);
    expect(afterSecond[0].id).toBe("1");
    expect(afterSecond[0].label).toBe("hi");
  });

  test("leaves the input array untouched", () => {
    const original: MessagePart[] = [{ id: "1", label: "ca", language: "en" }];

    appendText(original, "t", "en");

    expect(original[0].label).toBe("ca");
  });
});

describe("applyBackspace", () => {
  const graphemes = [
    "😀",
    "e\u0301",
    "ש\u05C1\u05B8",
    "👍🏽",
    "👨‍👩‍👧‍👦",
    "🇮🇱",
    "✌️",
    "1️⃣",
  ];

  test("removes a single character if the last part is text-only", () => {
    const parts = applyBackspace([
      { id: "1", label: "hello", language: "en" },
      { id: "2", label: "world", language: "en" },
    ]);

    expect(parts).toEqual([
      { id: "1", label: "hello", language: "en" },
      { id: "2", label: "worl", language: "en" },
    ]);
  });

  test.each(graphemes)("removes the complete final grapheme %s", (grapheme) => {
    const original: MessagePart[] = [
      { id: "1", label: "hello", language: "en" },
      { id: "2", label: `a${grapheme}`, language: "en" },
    ];

    const parts = applyBackspace(original);

    expect(parts).toEqual([
      { id: "1", label: "hello", language: "en" },
      { id: "2", label: "a", language: "en" },
    ]);
    expect(original[1].label).toBe(`a${grapheme}`);
  });

  test.each(["w", "", ...graphemes])(
    "removes the entire text-only part containing at most one grapheme (%s)",
    (label) => {
      const parts = applyBackspace([
        { id: "1", label: "hello", language: "en" },
        { id: "2", label, language: "en" },
      ]);

      expect(parts).toEqual([{ id: "1", label: "hello", language: "en" }]);
    },
  );

  test("removes the entire part if it is not text-only", () => {
    const parts = applyBackspace([
      { id: "1", label: "hello", language: "en" },
      { id: "2", label: "world", language: "en", imageSrc: "img.png" },
    ]);

    expect(parts).toEqual([{ id: "1", label: "hello", language: "en" }]);
  });

  test("returns an empty array when there is only one part and it gets removed", () => {
    expect(applyBackspace([{ id: "1", label: "h", language: "en" }])).toEqual(
      [],
    );
  });

  test("returns an empty array when already empty", () => {
    expect(applyBackspace([])).toEqual([]);
  });
});
