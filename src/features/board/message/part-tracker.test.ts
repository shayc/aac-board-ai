import { describe, expect, test } from "vitest";
import { createPartTracker, type SpokenPart } from "./part-tracker";

describe("createPartTracker", () => {
  test("joins parts into one space-separated utterance", () => {
    const parts: SpokenPart[] = [
      { id: "1", text: "I" },
      { id: "2", text: "want" },
    ];

    expect(createPartTracker(parts).text).toBe("I want");
  });

  test("trims surrounding whitespace from each part before joining", () => {
    const parts: SpokenPart[] = [
      { id: "1", text: " I " },
      { id: "2", text: "want " },
    ];

    expect(createPartTracker(parts).text).toBe("I want");
  });

  test("collapses internal whitespace within a part", () => {
    const tracker = createPartTracker([{ id: "1", text: "good   morning" }]);

    expect(tracker.text).toBe("good morning");
    expect(tracker.partIdAt(5)).toBe("1"); // "morning" lands inside the same part
  });

  test("maps a boundary offset to the part that owns it", () => {
    const tracker = createPartTracker([
      { id: "1", text: "I" },
      { id: "2", text: "want" },
    ]);

    expect(tracker.partIdAt(0)).toBe("1"); // "I"
    expect(tracker.partIdAt(2)).toBe("2"); // "want"
  });

  test("keeps a multi-word part active across its inner word boundaries", () => {
    const tracker = createPartTracker([
      { id: "1", text: "good morning" },
      { id: "2", text: "everyone" },
    ]);

    expect(tracker.partIdAt(0)).toBe("1"); // "good"
    expect(tracker.partIdAt(5)).toBe("1"); // "morning", still part 1
    expect(tracker.partIdAt(13)).toBe("2"); // "everyone"
  });

  test("returns null for an offset past the end of the utterance", () => {
    const tracker = createPartTracker([{ id: "1", text: "hi" }]);

    expect(tracker.partIdAt(99)).toBeNull();
  });
});
