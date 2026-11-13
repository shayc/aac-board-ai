import { describe, expect, test } from "vitest";
import {
  appendPart,
  appendText,
  applyBackspace,
  closedMessage,
  closeLastWord,
  createTextPart,
  createTilePart,
  EMPTY_MESSAGE,
} from "./message-transforms";
import type { Message, MessagePart } from "./message-types";

const HELLO: MessagePart = { id: "1", kind: "tile", label: "hello" };

function spelling(label: string, earlierParts: MessagePart[] = []): Message {
  return {
    parts: [...earlierParts, { id: "spelled", kind: "text", label }],
    isLastWordOpen: true,
  };
}

function labels(message: Message): string[] {
  return message.parts.map((part) => part.label);
}

describe("createTilePart", () => {
  test("mints a distinct id for each part even with identical content", () => {
    const first = createTilePart({ label: "cat" });
    const second = createTilePart({ label: "cat" });

    expect(first.id).toBeTruthy();
    expect(first.id).not.toBe(second.id);
  });

  test("marks the part as a tile part", () => {
    expect(createTilePart({ label: "cat" }).kind).toBe("tile");
  });
});

describe("createTextPart", () => {
  test("marks the part as a text part", () => {
    expect(createTextPart("cat")).toMatchObject({ kind: "text", label: "cat" });
  });
});

describe("appendPart", () => {
  test("appends the part after the existing parts", () => {
    const part: MessagePart = { id: "2", kind: "tile", label: "there" };

    const message = appendPart(closedMessage([HELLO]), part);

    expect(message).toEqual(closedMessage([HELLO, part]));
  });

  test("closes the open word before the appended part", () => {
    const part: MessagePart = { id: "2", kind: "tile", label: "there" };

    const message = appendPart(spelling("hi"), part);

    expect(message.isLastWordOpen).toBe(false);
    expect(labels(message)).toEqual(["hi", "there"]);
  });
});

describe("appendText", () => {
  test("opens a text part when the message is empty", () => {
    const message = appendText(EMPTY_MESSAGE, "h");

    expect(message.isLastWordOpen).toBe(true);
    expect(message.parts).toHaveLength(1);
    expect(message.parts[0]).toMatchObject({ kind: "text", label: "h" });
    expect(message.parts[0]?.id).toBeTruthy();
  });

  test("adds letters to the open word", () => {
    const message = appendText(spelling("ca", [HELLO]), "t");

    expect(message).toEqual(spelling("cat", [HELLO]));
  });

  test.each([
    { description: "a tile part without media", part: HELLO },
    {
      description: "a tile part with media",
      part: { ...HELLO, imageSrc: "img.png" },
    },
    {
      description: "a closed text part",
      part: { id: "1", kind: "text", label: "the" },
    },
  ] satisfies { description: string; part: MessagePart }[])(
    "opens a new word after $description",
    ({ part }) => {
      const message = appendText(closedMessage([part]), "c");

      expect(message.isLastWordOpen).toBe(true);
      expect(message.parts[0]).toBe(part);
      expect(labels(message)).toEqual([part.label, "c"]);
    },
  );

  test("spells nothing for empty text", () => {
    const original = closedMessage([HELLO]);

    expect(appendText(original, "")).toBe(original);
  });
});

describe("closeLastWord", () => {
  test("keeps the parts and closes the open word", () => {
    const open = spelling("world", [HELLO]);

    const message = closeLastWord(open);

    expect(message).toEqual(closedMessage(open.parts));
  });

  test("makes the next letters start a new word", () => {
    const message = appendText(closeLastWord(spelling("hi")), "u");

    expect(labels(message)).toEqual(["hi", "u"]);
  });

  test("returns the same message when there is no open word", () => {
    const original = closedMessage([HELLO]);

    expect(closeLastWord(original)).toBe(original);
  });
});

describe("applyBackspace", () => {
  const graphemes = ["😀", "é", "שָׁ", "👍🏽", "👨‍👩‍👧‍👦", "🇮🇱", "✌️", "1️⃣"];

  test("removes one character from the open word", () => {
    const message = applyBackspace(spelling("world", [HELLO]));

    expect(message).toEqual(spelling("worl", [HELLO]));
  });

  test.each(graphemes)("removes the complete final grapheme %s", (grapheme) => {
    const message = applyBackspace(spelling(`a${grapheme}`, [HELLO]));

    expect(message).toEqual(spelling("a", [HELLO]));
  });

  test.each(["w", ...graphemes])(
    "removes a text part when its only grapheme is removed (%s)",
    (label) => {
      const message = applyBackspace(spelling(label, [HELLO]));

      expect(message).toEqual(closedMessage([HELLO]));
    },
  );

  test.each([
    { description: "without media", part: HELLO },
    { description: "with media", part: { ...HELLO, imageSrc: "img.png" } },
  ])("removes a tile part whole $description", ({ part }) => {
    const earlier: MessagePart = { id: "0", kind: "tile", label: "say" };

    const message = applyBackspace(closedMessage([earlier, part]));

    expect(message).toEqual(closedMessage([earlier]));
  });

  test("reopens a closed text part and removes its last character", () => {
    const message = applyBackspace(closeLastWord(spelling("world", [HELLO])));

    expect(message).toEqual(spelling("worl", [HELLO]));
  });

  test("leaves text parts before the last part untouched", () => {
    const tile: MessagePart = { id: "2", kind: "tile", label: "there" };
    const spelled = closeLastWord(spelling("hi"));

    const message = applyBackspace(appendPart(spelled, tile));

    expect(message).toEqual(spelled);
  });

  test("returns the same message when there is nothing to remove", () => {
    expect(applyBackspace(EMPTY_MESSAGE)).toBe(EMPTY_MESSAGE);
  });
});
