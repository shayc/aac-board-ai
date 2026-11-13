import { describe, expect, test } from "vitest";
import {
  appendTilePart,
  applyBackspace,
  closeWord,
  createTextPart,
  createTilePart,
  EMPTY_MESSAGE,
  markSpoken,
  spell,
} from "./message-transforms";
import type { Message, TilePart } from "./message-types";

const HELLO_TILE: TilePart = {
  kind: "tile",
  id: "tile",
  label: "hello",
  imageSrc: "img.png",
};

function labelsOf(message: Message): string[] {
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

describe("appendTilePart", () => {
  test("appends the part and leaves the input untouched", () => {
    const original: Message = { ...EMPTY_MESSAGE, parts: [HELLO_TILE] };

    const message = appendTilePart(
      original,
      createTilePart({ label: "there" }),
    );

    expect(original.parts).toHaveLength(1);
    expect(labelsOf(message)).toEqual(["hello", "there"]);
  });

  test("closes the word being spelled", () => {
    const spelled = spell(EMPTY_MESSAGE, "hi");

    const message = spell(appendTilePart(spelled, HELLO_TILE), "y");

    expect(labelsOf(message)).toEqual(["hi", "hello", "y"]);
  });
});

describe("spell", () => {
  test("starts a word in an empty message", () => {
    const message = spell(EMPTY_MESSAGE, "h");

    expect(message.parts).toHaveLength(1);
    expect(message.parts[0]).toMatchObject({ kind: "text", label: "h" });
    expect(message.parts[0]?.id).toBeTruthy();
  });

  test("extends the word being spelled, keeping its id", () => {
    const first = spell(EMPTY_MESSAGE, "ca");

    const message = spell(first, "t");

    expect(labelsOf(message)).toEqual(["cat"]);
    expect(message.parts[0]?.id).toBe(first.parts[0]?.id);
  });

  test("starts a new word after a tile, even one without media", () => {
    const tile = createTilePart({ label: "the" });

    const message = spell(appendTilePart(EMPTY_MESSAGE, tile), "c");

    expect(labelsOf(message)).toEqual(["the", "c"]);
  });

  test("starts a new word after a closed text part", () => {
    const closed: Message = {
      parts: [createTextPart("want")],
      isWordOpen: false,
      isSpoken: false,
    };

    const message = spell(closed, "s");

    expect(labelsOf(message)).toEqual(["want", "s"]);
  });

  test("ignores empty text", () => {
    expect(spell(EMPTY_MESSAGE, "")).toBe(EMPTY_MESSAGE);
  });

  test("leaves the input untouched", () => {
    const original = spell(EMPTY_MESSAGE, "ca");

    spell(original, "t");

    expect(labelsOf(original)).toEqual(["ca"]);
  });
});

describe("closeWord", () => {
  test("makes the next letter start a new word", () => {
    const message = spell(closeWord(spell(EMPTY_MESSAGE, "hi")), "yo");

    expect(labelsOf(message)).toEqual(["hi", "yo"]);
  });

  test("adds nothing to the message", () => {
    const spelled = spell(EMPTY_MESSAGE, "hi");

    expect(closeWord(spelled).parts).toBe(spelled.parts);
    expect(closeWord(EMPTY_MESSAGE)).toBe(EMPTY_MESSAGE);
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

  test("removes the last character of a spelled word", () => {
    const message = applyBackspace(spell(EMPTY_MESSAGE, "world"));

    expect(labelsOf(message)).toEqual(["worl"]);
  });

  test.each(graphemes)("removes the complete final grapheme %s", (grapheme) => {
    const original = spell(EMPTY_MESSAGE, `a${grapheme}`);

    const message = applyBackspace(original);

    expect(labelsOf(message)).toEqual(["a"]);
    expect(labelsOf(original)).toEqual([`a${grapheme}`]);
  });

  test.each(["w", ...graphemes])(
    "removes a word once its only grapheme is deleted (%s)",
    (label) => {
      const original = spell(appendTilePart(EMPTY_MESSAGE, HELLO_TILE), label);

      const message = applyBackspace(original);

      expect(message.parts).toEqual([HELLO_TILE]);
    },
  );

  test("removes a whole tile part, even one without media", () => {
    const tile = createTilePart({ label: "world" });
    const original = appendTilePart(spell(EMPTY_MESSAGE, "hi"), tile);

    const message = applyBackspace(original);

    expect(labelsOf(message)).toEqual(["hi"]);
  });

  test("starts a new word after backspacing a one-letter word", () => {
    const spelled = spell(closeWord(spell(EMPTY_MESSAGE, "hi")), "y");

    const message = spell(applyBackspace(spelled), "o");

    expect(labelsOf(message)).toEqual(["hi", "o"]);
  });

  test("starts a new word after backspacing a tile that followed spelling", () => {
    const original = appendTilePart(spell(EMPTY_MESSAGE, "hi"), HELLO_TILE);

    const message = spell(applyBackspace(original), "o");

    expect(labelsOf(message)).toEqual(["hi", "o"]);
  });

  test("reopens a closed word without removing a letter", () => {
    const closed = closeWord(spell(EMPTY_MESSAGE, "hi"));

    const message = spell(applyBackspace(closed), "t");

    expect(labelsOf(message)).toEqual(["hit"]);
  });

  test("removes a letter from a closed word on the second press", () => {
    const closed = closeWord(spell(EMPTY_MESSAGE, "hit"));

    const message = spell(applyBackspace(applyBackspace(closed)), "m");

    expect(labelsOf(message)).toEqual(["him"]);
  });

  test("returns an empty message when its only part is removed", () => {
    expect(applyBackspace(spell(EMPTY_MESSAGE, "h"))).toEqual(EMPTY_MESSAGE);
  });

  test("leaves an empty message as it is", () => {
    expect(applyBackspace(EMPTY_MESSAGE)).toBe(EMPTY_MESSAGE);
  });
});

describe("a spoken message", () => {
  const spoken = markSpoken(spell(EMPTY_MESSAGE, "hi"), true);

  test("is replaced by the next tile", () => {
    const message = appendTilePart(spoken, HELLO_TILE);

    expect(labelsOf(message)).toEqual(["hello"]);
    expect(message.isSpoken).toBe(false);
  });

  test("is replaced by the next letter", () => {
    const message = spell(spoken, "y");

    expect(labelsOf(message)).toEqual(["y"]);
    expect(message.isSpoken).toBe(false);
  });

  test("stays as it is for a space", () => {
    expect(closeWord(spoken)).toBe(spoken);
  });

  test("is edited by backspace, and then added to", () => {
    const message = spell(applyBackspace(spoken), "t");

    expect(labelsOf(message)).toEqual(["ht"]);
  });

  test("is added to once a backspace reopens its closed word", () => {
    const closed = markSpoken(closeWord(spell(EMPTY_MESSAGE, "hi")), true);

    const message = spell(applyBackspace(closed), "t");

    expect(labelsOf(message)).toEqual(["hit"]);
  });
});
