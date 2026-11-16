import { describe, expect, test } from "vitest";
import {
  appendTilePart,
  applyBackspace,
  applyEdits,
  closeWord,
  createTextPart,
  createTilePart,
  EMPTY_MESSAGE,
  hasSameContent,
  markPlayed,
  spell,
} from "./message-transforms";
import type { Message, TilePart } from "./message-types";

const HELLO_TILE: TilePart = {
  kind: "tile",
  id: "tile",
  label: "hello",
  language: "en",
  imageSrc: "img.png",
};

function labelsOf(message: Message): string[] {
  return message.parts.map((part) => part.label);
}

describe("createTilePart", () => {
  test("mints a distinct id for each part even with identical content", () => {
    const first = createTilePart({ label: "cat", language: "en" });
    const second = createTilePart({ label: "cat", language: "en" });

    expect(first.id).toBeTruthy();
    expect(first.id).not.toBe(second.id);
  });
});

describe("appendTilePart", () => {
  test("appends the part and leaves the input untouched", () => {
    const original: Message = { ...EMPTY_MESSAGE, parts: [HELLO_TILE] };

    const message = appendTilePart(
      original,
      createTilePart({ label: "there", language: "en" }),
    );

    expect(original.parts).toHaveLength(1);
    expect(labelsOf(message)).toEqual(["hello", "there"]);
  });

  test("closes the word being spelled", () => {
    const spelled = spell(EMPTY_MESSAGE, "hi", "en");

    const message = spell(appendTilePart(spelled, HELLO_TILE), "y", "en");

    expect(labelsOf(message)).toEqual(["hi", "hello", "y"]);
  });
});

describe("spell", () => {
  test("starts a word in an empty message", () => {
    const message = spell(EMPTY_MESSAGE, "h", "en");

    expect(message.parts).toHaveLength(1);
    expect(message.parts[0]).toMatchObject({ kind: "text", label: "h" });
    expect(message.parts[0]?.id).toBeTruthy();
  });

  test("extends the word being spelled, keeping its id", () => {
    const first = spell(EMPTY_MESSAGE, "ca", "en");

    const message = spell(first, "t", "en");

    expect(labelsOf(message)).toEqual(["cat"]);
    expect(message.parts[0]?.id).toBe(first.parts[0]?.id);
  });

  test("keeps the language a word was started in", () => {
    const first = spell(EMPTY_MESSAGE, "ca", "en");

    const message = spell(first, "t", "he");

    expect(message.parts).toMatchObject([{ label: "cat", language: "en" }]);
  });

  test("starts a new word after a tile, even one without media", () => {
    const tile = createTilePart({ label: "the", language: "en" });

    const message = spell(appendTilePart(EMPTY_MESSAGE, tile), "c", "en");

    expect(labelsOf(message)).toEqual(["the", "c"]);
  });

  test("starts a new word after a closed text part", () => {
    const closed: Message = {
      parts: [createTextPart("want", "en")],
      isWordOpen: false,
      hasPlayed: false,
    };

    const message = spell(closed, "s", "en");

    expect(labelsOf(message)).toEqual(["want", "s"]);
  });

  test("ignores empty text", () => {
    expect(spell(EMPTY_MESSAGE, "", "en")).toBe(EMPTY_MESSAGE);
  });

  test("leaves the input untouched", () => {
    const original = spell(EMPTY_MESSAGE, "ca", "en");

    spell(original, "t", "en");

    expect(labelsOf(original)).toEqual(["ca"]);
  });
});

describe("closeWord", () => {
  test("makes the next letter start a new word", () => {
    const message = spell(
      closeWord(spell(EMPTY_MESSAGE, "hi", "en")),
      "yo",
      "en",
    );

    expect(labelsOf(message)).toEqual(["hi", "yo"]);
  });

  test("adds nothing to the message", () => {
    const spelled = spell(EMPTY_MESSAGE, "hi", "en");

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
    const message = applyBackspace(spell(EMPTY_MESSAGE, "world", "en"));

    expect(labelsOf(message)).toEqual(["worl"]);
  });

  test.each(graphemes)("removes the complete final grapheme %s", (grapheme) => {
    const original = spell(EMPTY_MESSAGE, `a${grapheme}`, "en");

    const message = applyBackspace(original);

    expect(labelsOf(message)).toEqual(["a"]);
    expect(labelsOf(original)).toEqual([`a${grapheme}`]);
  });

  test.each(["w", ...graphemes])(
    "removes a word once its only grapheme is deleted (%s)",
    (label) => {
      const original = spell(
        appendTilePart(EMPTY_MESSAGE, HELLO_TILE),
        label,
        "en",
      );

      const message = applyBackspace(original);

      expect(message.parts).toEqual([HELLO_TILE]);
    },
  );

  test("removes a whole tile part, even one without media", () => {
    const tile = createTilePart({ label: "world", language: "en" });
    const original = appendTilePart(spell(EMPTY_MESSAGE, "hi", "en"), tile);

    const message = applyBackspace(original);

    expect(labelsOf(message)).toEqual(["hi"]);
  });

  test("starts a new word after backspacing a one-letter word", () => {
    const spelled = spell(
      closeWord(spell(EMPTY_MESSAGE, "hi", "en")),
      "y",
      "en",
    );

    const message = spell(applyBackspace(spelled), "o", "en");

    expect(labelsOf(message)).toEqual(["hi", "o"]);
  });

  test("starts a new word after backspacing a tile that followed spelling", () => {
    const original = appendTilePart(
      spell(EMPTY_MESSAGE, "hi", "en"),
      HELLO_TILE,
    );

    const message = spell(applyBackspace(original), "o", "en");

    expect(labelsOf(message)).toEqual(["hi", "o"]);
  });

  test("reopens a closed word without removing a letter", () => {
    const closed = closeWord(spell(EMPTY_MESSAGE, "hi", "en"));

    const message = spell(applyBackspace(closed), "t", "en");

    expect(labelsOf(message)).toEqual(["hit"]);
  });

  test("removes a letter from a closed word on the second press", () => {
    const closed = closeWord(spell(EMPTY_MESSAGE, "hit", "en"));

    const message = spell(applyBackspace(applyBackspace(closed)), "m", "en");

    expect(labelsOf(message)).toEqual(["him"]);
  });

  test("returns an empty message when its only part is removed", () => {
    expect(applyBackspace(spell(EMPTY_MESSAGE, "h", "en"))).toEqual(
      EMPTY_MESSAGE,
    );
  });

  test("leaves an empty message as it is", () => {
    expect(applyBackspace(EMPTY_MESSAGE)).toBe(EMPTY_MESSAGE);
  });
});

describe("applyEdits", () => {
  test("applies each edit in order", () => {
    const message = applyEdits(EMPTY_MESSAGE, [
      { kind: "tile", part: HELLO_TILE },
      { kind: "spell", text: "wo", language: "en" },
      { kind: "backspace" },
      { kind: "space" },
      { kind: "spell", text: "a", language: "en" },
    ]);

    expect(labelsOf(message)).toEqual(["hello", "w", "a"]);
  });

  test("empties the message for a clear", () => {
    const message = spell(EMPTY_MESSAGE, "hi", "en");

    expect(applyEdits(message, [{ kind: "clear" }])).toBe(EMPTY_MESSAGE);
  });

  test("returns an empty message itself for a clear", () => {
    const emptied = applyBackspace(spell(EMPTY_MESSAGE, "h", "en"));

    expect(applyEdits(emptied, [{ kind: "clear" }])).toBe(emptied);
  });

  test("returns the message itself when no edit changes it", () => {
    const message = closeWord(spell(EMPTY_MESSAGE, "hi", "en"));

    expect(applyEdits(message, [{ kind: "space" }])).toBe(message);
  });
});

describe("hasSameContent", () => {
  const message = closeWord(spell(EMPTY_MESSAGE, "hi", "en"));

  test("ignores whether the message was spoken", () => {
    expect(hasSameContent(markPlayed(message, true), message)).toBe(true);
  });

  test.each([
    { description: "a letter", edited: spell(message, "a", "en") },
    {
      description: "a backspace that only reopens the word",
      edited: applyBackspace(message),
    },
    { description: "a space", edited: closeWord(spell(message, "a", "en")) },
  ])("tells a message from itself after $description", ({ edited }) => {
    expect(hasSameContent(edited, message)).toBe(false);
  });
});

describe("a spoken message", () => {
  const spoken = markPlayed(spell(EMPTY_MESSAGE, "hi", "en"), true);

  test("is replaced by the next tile", () => {
    const message = appendTilePart(spoken, HELLO_TILE);

    expect(labelsOf(message)).toEqual(["hello"]);
    expect(message.hasPlayed).toBe(false);
  });

  test("is replaced by the next letter", () => {
    const message = spell(spoken, "y", "en");

    expect(labelsOf(message)).toEqual(["y"]);
    expect(message.hasPlayed).toBe(false);
  });

  test("stays as it is for a space", () => {
    expect(closeWord(spoken)).toBe(spoken);
  });

  test("is edited by backspace, and then added to", () => {
    const message = spell(applyBackspace(spoken), "t", "en");

    expect(labelsOf(message)).toEqual(["ht"]);
  });

  test("is added to once a backspace reopens its closed word", () => {
    const closed = markPlayed(
      closeWord(spell(EMPTY_MESSAGE, "hi", "en")),
      true,
    );

    const message = spell(applyBackspace(closed), "t", "en");

    expect(labelsOf(message)).toEqual(["hit"]);
  });
});
