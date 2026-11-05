import { describe, expect, test } from "vitest";
import { parseMessageParts } from "./message-store";

describe("parseMessageParts", () => {
  test("restores stored parts with their media", () => {
    const stored = [
      {
        id: "1",
        label: "water",
        vocalization: "I want water",
        imageSrc: "https://example.com/water.png",
        soundSrc: "data:audio/wav;base64,AAAA",
      },
    ];

    expect(parseMessageParts(stored)).toEqual(stored);
  });

  test("drops blob URLs, which do not outlive the page that created them", () => {
    const [part] = parseMessageParts([
      {
        id: "1",
        label: "cat",
        imageSrc: "blob:http://localhost/1",
        soundSrc: "blob:http://localhost/2",
      },
    ]);

    expect(part).toStrictEqual({
      id: "1",
      label: "cat",
      vocalization: undefined,
      imageSrc: undefined,
      soundSrc: undefined,
    });
  });

  test.each([
    { description: "nothing stored", raw: undefined },
    { description: "a non-array value", raw: { id: "1", label: "cat" } },
  ])("starts empty when there is $description", ({ raw }) => {
    expect(parseMessageParts(raw)).toEqual([]);
  });

  test("skips malformed parts and keeps the rest", () => {
    const parts = parseMessageParts([
      null,
      "cat",
      { id: 1, label: "dog" },
      { id: "2" },
      { id: "3", label: "bird" },
    ]);

    expect(parts.map((part) => part.label)).toEqual(["bird"]);
  });
});
