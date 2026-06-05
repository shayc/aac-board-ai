import { describe, expect, test } from "vitest";
import type { MessagePart } from "../use-message";
import { planPlayback } from "./plan-playback";

describe("planPlayback", () => {
  test("returns no steps for an empty message", () => {
    expect(planPlayback([])).toEqual([]);
  });

  test("merges a run of text parts into a single speech step", () => {
    const parts: MessagePart[] = [
      { id: "1", label: "I" },
      { id: "2", label: "want" },
    ];

    const steps = planPlayback(parts);

    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({ kind: "speech" });
    if (steps[0].kind === "speech") {
      expect(steps[0].tracker.text).toBe("i want");
    }
  });

  test("emits a sound part as its own step carrying its part id", () => {
    const steps = planPlayback([
      { id: "1", label: "bell", soundSrc: "bell.mp3" },
    ]);

    expect(steps).toEqual([{ kind: "sound", partId: "1", src: "bell.mp3" }]);
  });

  test("preserves order when a sound breaks a text run", () => {
    const parts: MessagePart[] = [
      { id: "1", label: "hello" },
      { id: "2", label: "ding", soundSrc: "ding.mp3" },
      { id: "3", label: "world" },
    ];

    const steps = planPlayback(parts);

    expect(steps.map((step) => step.kind)).toEqual([
      "speech",
      "sound",
      "speech",
    ]);
  });

  test("speaks the vocalization rather than the label when present", () => {
    const steps = planPlayback([
      { id: "1", label: "🙂", vocalization: "Happy" },
    ]);

    expect(steps[0].kind === "speech" && steps[0].tracker.text).toBe("happy");
  });

  test("skips parts with no spoken text, such as inserted spaces", () => {
    const steps = planPlayback([
      { id: "1", label: "hi" },
      { id: "2", label: "" },
    ]);

    expect(steps).toHaveLength(1);
    expect(steps[0].kind === "speech" && steps[0].tracker.text).toBe("hi");
  });
});
