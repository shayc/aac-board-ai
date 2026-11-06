import { describe, expect, test } from "vitest";
import { joinSpokenParts, type SpokenPart } from "./join-spoken-parts";

describe("joinSpokenParts", () => {
  test("joins parts into one space-separated utterance", () => {
    const parts: SpokenPart[] = [
      { id: "1", text: "I" },
      { id: "2", text: "want" },
    ];

    expect(joinSpokenParts(parts).text).toBe("I want");
  });

  test("trims surrounding whitespace from each part before joining", () => {
    const parts: SpokenPart[] = [
      { id: "1", text: " I " },
      { id: "2", text: "want " },
    ];

    expect(joinSpokenParts(parts).text).toBe("I want");
  });

  test("collapses internal whitespace within a part", () => {
    const joined = joinSpokenParts([{ id: "1", text: "good   morning" }]);

    expect(joined.text).toBe("good morning");
    expect(joined.partIdAt(5)).toBe("1"); // "morning" lands inside the same part
  });

  test("maps a boundary offset to the part that owns it", () => {
    const joined = joinSpokenParts([
      { id: "1", text: "I" },
      { id: "2", text: "want" },
    ]);

    expect(joined.partIdAt(0)).toBe("1"); // "I"
    expect(joined.partIdAt(2)).toBe("2"); // "want"
  });

  test("keeps a multi-word part active across its inner word boundaries", () => {
    const joined = joinSpokenParts([
      { id: "1", text: "good morning" },
      { id: "2", text: "everyone" },
    ]);

    expect(joined.partIdAt(0)).toBe("1"); // "good"
    expect(joined.partIdAt(5)).toBe("1"); // "morning", still part 1
    expect(joined.partIdAt(13)).toBe("2"); // "everyone"
  });

  test("returns null for an offset past the end of the utterance", () => {
    const joined = joinSpokenParts([{ id: "1", text: "hi" }]);

    expect(joined.partIdAt(99)).toBeNull();
  });
});
