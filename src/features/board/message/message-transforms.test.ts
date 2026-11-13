import { describe, expect, test } from "vitest";
import {
  appendPart,
  applyBackspace,
  createTextPart,
  createTilePart,
  EMPTY_MESSAGE,
  finishWord,
  spellText,
} from "./message-transforms";
import type { MessagePart, MessageState } from "./message-types";

const HELLO_TILE: MessagePart = {
  kind: "tile",
  id: "tile",
  label: "hello",
  imageSrc: "img.png",
};

function labelsOf(message: MessageState): string[] {
  return message.parts.map((part) => part.label);
}

describe("createTilePart", () => {
  test("mints a distinct id for each part even with identical content", () => {
    const first = createTilePart({ label: "cat" });
    const second = createTilePart({ label: "cat" });

    expect(first.id).toBeTruthy();
    expect(first.id).not.toBe(second.id);
  });
});

describe("appendPart", () => {
  test("appends the part and leaves the input untouched", () => {
    const original: MessageState = { parts: [HELLO_TILE], isWordOpen: false };

    const message = appendPart(original, createTextPart("there"));

    expect(original.parts).toHaveLength(1);
    expect(labelsOf(message)).toEqual(["hello", "there"]);
  });

  test("ends the word being spelled", () => {
    const spelled = spellText(EMPTY_MESSAGE, "hi");

    const message = spellText(appendPart(spelled, HELLO_TILE), "y");

    expect(labelsOf(message)).toEqual(["hi", "hello", "y"]);
  });
});

describe("spellText", () => {
  test("starts a word in an empty message", () => {
    const message = spellText(EMPTY_MESSAGE, "h");

    expect(message.parts).toHaveLength(1);
    expect(message.parts[0]).toMatchObject({ kind: "text", label: "h" });
    expect(message.parts[0]?.id).toBeTruthy();
  });

  test("extends the word being spelled, keeping its id", () => {
    const first = spellText(EMPTY_MESSAGE, "ca");

    const message = spellText(first, "t");

    expect(labelsOf(message)).toEqual(["cat"]);
    expect(message.parts[0]?.id).toBe(first.parts[0]?.id);
  });

  test("starts a new word after a tile, even one without media", () => {
    const tile = createTilePart({ label: "the" });

    const message = spellText(appendPart(EMPTY_MESSAGE, tile), "c");

    expect(labelsOf(message)).toEqual(["the", "c"]);
  });

  test("starts a new word after a suggested word", () => {
    const suggested: MessageState = {
      parts: [createTextPart("want")],
      isWordOpen: false,
    };

    const message = spellText(suggested, "s");

    expect(labelsOf(message)).toEqual(["want", "s"]);
  });

  test("ignores empty text", () => {
    expect(spellText(EMPTY_MESSAGE, "")).toBe(EMPTY_MESSAGE);
  });

  test("leaves the input untouched", () => {
    const original = spellText(EMPTY_MESSAGE, "ca");

    spellText(original, "t");

    expect(labelsOf(original)).toEqual(["ca"]);
  });
});

describe("finishWord", () => {
  test("makes the next letter start a new word", () => {
    const message = spellText(finishWord(spellText(EMPTY_MESSAGE, "hi")), "yo");

    expect(labelsOf(message)).toEqual(["hi", "yo"]);
  });

  test("adds nothing to the message", () => {
    const spelled = spellText(EMPTY_MESSAGE, "hi");

    expect(finishWord(spelled).parts).toBe(spelled.parts);
    expect(finishWord(EMPTY_MESSAGE)).toBe(EMPTY_MESSAGE);
  });
});

describe("applyBackspace", () => {
  const graphemes = ["😀", "é", "שָׁ", "👍🏽", "👨‍👩‍👧‍👦", "🇮🇱", "✌️", "1️⃣"];

  test("removes the last character of a spelled word", () => {
    const message = applyBackspace(spellText(EMPTY_MESSAGE, "world"));

    expect(labelsOf(message)).toEqual(["worl"]);
  });

  test.each(graphemes)("removes the complete final grapheme %s", (grapheme) => {
    const original = spellText(EMPTY_MESSAGE, `a${grapheme}`);

    const message = applyBackspace(original);

    expect(labelsOf(message)).toEqual(["a"]);
    expect(labelsOf(original)).toEqual([`a${grapheme}`]);
  });

  test.each(["w", ...graphemes])(
    "removes a word once its only grapheme is deleted (%s)",
    (label) => {
      const original = spellText(appendPart(EMPTY_MESSAGE, HELLO_TILE), label);

      const message = applyBackspace(original);

      expect(message.parts).toEqual([HELLO_TILE]);
    },
  );

  test("removes a whole tile part, even one without media", () => {
    const tile = createTilePart({ label: "world" });
    const original = appendPart(spellText(EMPTY_MESSAGE, "hi"), tile);

    const message = applyBackspace(original);

    expect(labelsOf(message)).toEqual(["hi"]);
  });

  test("starts a new word after backspacing a one-letter word", () => {
    const spelled = spellText(finishWord(spellText(EMPTY_MESSAGE, "hi")), "y");

    const message = spellText(applyBackspace(spelled), "o");

    expect(labelsOf(message)).toEqual(["hi", "o"]);
  });

  test("starts a new word after backspacing a tile that followed spelling", () => {
    const original = appendPart(spellText(EMPTY_MESSAGE, "hi"), HELLO_TILE);

    const message = spellText(applyBackspace(original), "o");

    expect(labelsOf(message)).toEqual(["hi", "o"]);
  });

  test("reopens a finished word so the next letter continues it", () => {
    const finished = finishWord(spellText(EMPTY_MESSAGE, "hit"));

    const message = spellText(applyBackspace(finished), "m");

    expect(labelsOf(message)).toEqual(["him"]);
  });

  test("returns an empty message when its only part is removed", () => {
    expect(applyBackspace(spellText(EMPTY_MESSAGE, "h"))).toEqual(
      EMPTY_MESSAGE,
    );
  });

  test("leaves an empty message as it is", () => {
    expect(applyBackspace(EMPTY_MESSAGE)).toBe(EMPTY_MESSAGE);
  });
});
