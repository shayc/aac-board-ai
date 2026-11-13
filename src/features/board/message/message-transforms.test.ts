import { describe, expect, test } from "vitest";
import {
  appendPart,
  appendText,
  applyBackspace,
  createPart,
  EMPTY_MESSAGE,
  finishedMessage,
  finishSpelling,
  messageParts,
} from "./message-transforms";
import type { Message, MessagePart } from "./message-types";

const HELLO: MessagePart = { id: "1", label: "hello" };

function spelling(label: string, finishedParts: MessagePart[] = []): Message {
  return {
    finishedParts,
    openWord: { id: "spelled", label, isSpelled: true },
  };
}

function labels(message: Message): string[] {
  return messageParts(message).map((part) => part.label);
}

describe("createPart", () => {
  test("mints a distinct id for each part even with identical content", () => {
    const first = createPart({ label: "cat" });
    const second = createPart({ label: "cat" });

    expect(first.id).toBeTruthy();
    expect(first.id).not.toBe(second.id);
  });
});

describe("messageParts", () => {
  test("lists the spelled word after the finished parts", () => {
    expect(labels(spelling("wor", [HELLO]))).toEqual(["hello", "wor"]);
  });

  test("keeps the finished parts array when no word is being spelled", () => {
    const parts = [HELLO];

    expect(messageParts(finishedMessage(parts))).toBe(parts);
  });
});

describe("appendPart", () => {
  test("appends the part as a finished part", () => {
    const part: MessagePart = { id: "2", label: "there" };

    const message = appendPart(finishedMessage([HELLO]), part);

    expect(message).toEqual(finishedMessage([HELLO, part]));
  });

  test("finishes the spelled word before the appended part", () => {
    const part: MessagePart = { id: "2", label: "there" };

    const message = appendPart(spelling("hi"), part);

    expect(message.openWord).toBeNull();
    expect(labels(message)).toEqual(["hi", "there"]);
  });
});

describe("appendText", () => {
  test("starts a spelled word when the message is empty", () => {
    const message = appendText(EMPTY_MESSAGE, "h");

    expect(message.finishedParts).toEqual([]);
    expect(message.openWord?.label).toBe("h");
    expect(message.openWord?.id).toBeTruthy();
    expect(message.openWord?.isSpelled).toBe(true);
  });

  test("adds letters to the word being spelled", () => {
    const message = appendText(spelling("ca"), "t");

    expect(message.openWord?.label).toBe("cat");
    expect(message.openWord?.id).toBe("spelled");
  });

  test.each([
    { description: "without media", part: { id: "1", label: "the" } },
    {
      description: "with media",
      part: { id: "1", label: "the", imageSrc: "img.png" },
    },
  ])("starts a new word after a finished part $description", ({ part }) => {
    const message = appendText(finishedMessage([part]), "c");

    expect(message.finishedParts).toEqual([part]);
    expect(message.openWord?.label).toBe("c");
  });

  test("spells nothing for empty text", () => {
    const original = finishedMessage([HELLO]);

    expect(appendText(original, "")).toBe(original);
  });
});

describe("finishSpelling", () => {
  test("turns the spelled word into a finished part", () => {
    const message = finishSpelling(spelling("world", [HELLO]));

    expect(message).toEqual(
      finishedMessage([
        HELLO,
        { id: "spelled", label: "world", isSpelled: true },
      ]),
    );
  });

  test("makes the next letters start a new word", () => {
    const message = appendText(finishSpelling(spelling("hi")), "u");

    expect(labels(message)).toEqual(["hi", "u"]);
  });

  test("returns the same message when no word is being spelled", () => {
    const original = finishedMessage([HELLO]);

    expect(finishSpelling(original)).toBe(original);
  });
});

describe("applyBackspace", () => {
  const graphemes = ["😀", "é", "שָׁ", "👍🏽", "👨‍👩‍👧‍👦", "🇮🇱", "✌️", "1️⃣"];

  test("removes one character from the word being spelled", () => {
    const message = applyBackspace(spelling("world", [HELLO]));

    expect(message).toEqual(spelling("worl", [HELLO]));
  });

  test.each(graphemes)("removes the complete final grapheme %s", (grapheme) => {
    const message = applyBackspace(spelling(`a${grapheme}`, [HELLO]));

    expect(message).toEqual(spelling("a", [HELLO]));
  });

  test.each(["w", ...graphemes])(
    "stops spelling when the word's only grapheme is removed (%s)",
    (label) => {
      const message = applyBackspace(spelling(label, [HELLO]));

      expect(message).toEqual(finishedMessage([HELLO]));
    },
  );

  test.each([
    { description: "without media", part: { id: "2", label: "world" } },
    {
      description: "with media",
      part: { id: "2", label: "world", imageSrc: "img.png" },
    },
  ])("removes a whole finished part $description", ({ part }) => {
    const message = applyBackspace(finishedMessage([HELLO, part]));

    expect(message).toEqual(finishedMessage([HELLO]));
  });

  test("reopens a finished spelled word and removes its last character", () => {
    const message = applyBackspace(finishSpelling(spelling("world", [HELLO])));

    expect(message).toEqual(spelling("worl", [HELLO]));
  });

  test("removes a finished spelled word once its only character is removed", () => {
    const message = applyBackspace(finishSpelling(spelling("w", [HELLO])));

    expect(message).toEqual(finishedMessage([HELLO]));
  });

  test("leaves spelled words before the last part finished", () => {
    const tile: MessagePart = { id: "2", label: "there" };
    const spelled = finishSpelling(spelling("hi"));

    const message = applyBackspace(appendPart(spelled, tile));

    expect(message).toEqual(spelled);
  });

  test("returns the same message when there is nothing to remove", () => {
    expect(applyBackspace(EMPTY_MESSAGE)).toBe(EMPTY_MESSAGE);
  });
});
