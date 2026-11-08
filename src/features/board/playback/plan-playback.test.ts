import { describe, expect, test } from "vitest";
import type { MessagePart } from "../message/message-types";
import { createPart } from "../message/message-transforms";
import { planPlayback } from "./plan-playback";

describe("planPlayback", () => {
  test("returns no steps for an empty message", () => {
    expect(planPlayback([])).toEqual([]);
  });

  test("merges a run of text parts into a single speech step", () => {
    const parts: MessagePart[] = [
      { id: "1", label: "I", language: "en" },
      { id: "2", label: "want", language: "en" },
    ];

    const steps = planPlayback(parts);

    expect(steps).toHaveLength(1);
    const step = steps[0];

    if (step.kind !== "speech") {
      throw new Error("Expected a speech step");
    }

    expect(step.text).toBe("i want");
    expect(step.language).toBe("en");
    expect(step.cueAt?.(2)).toBe("2");
  });

  test("starts a new speech step where the language changes", () => {
    const steps = planPlayback([
      { id: "1", label: "quiero", language: "es" },
      { id: "2", label: "apple", language: "en" },
      { id: "3", label: "juice", language: "en" },
    ]);

    expect(steps).toMatchObject([
      { kind: "speech", text: "quiero", language: "es" },
      { kind: "speech", text: "apple juice", language: "en" },
    ]);
  });

  test("emits a sound part as its own step carrying its part id", () => {
    const part = createPart({ language: "en", soundSrc: "bell.mp3" });
    const steps = planPlayback([part]);

    expect(steps).toEqual([{ kind: "audio", cue: part.id, src: "bell.mp3" }]);
  });

  test("preserves order when a sound breaks a text run", () => {
    const parts: MessagePart[] = [
      { id: "1", label: "hello", language: "en" },
      { id: "2", label: "ding", language: "en", soundSrc: "ding.mp3" },
      { id: "3", label: "world", language: "en" },
    ];

    const steps = planPlayback(parts);

    expect(steps.map((step) => step.kind)).toEqual([
      "speech",
      "audio",
      "speech",
    ]);
  });

  test("speaks the vocalization rather than the label when present", () => {
    const steps = planPlayback([
      { id: "1", label: "🙂", vocalization: "Happy", language: "en" },
    ]);

    expect(steps[0].kind === "speech" && steps[0].text).toBe("happy");
  });

  test("skips parts with no spoken text, such as inserted spaces", () => {
    const steps = planPlayback([
      { id: "1", label: "hi", language: "en" },
      { id: "2", label: "", language: "en" },
    ]);

    expect(steps).toHaveLength(1);
    expect(steps[0].kind === "speech" && steps[0].text).toBe("hi");
  });
});
