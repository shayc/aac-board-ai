import { describe, expect, test } from "vitest";
import type { MessagePart } from "../message/message-types";
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
    const step = steps[0];

    if (step.kind !== "speech") {
      throw new Error("Expected a speech step");
    }

    expect(step.text).toBe("i want");
    expect(step.trackingKeyAt?.(2)).toBe("2");
  });

  test("emits a sound part as its own step carrying its part id", () => {
    const steps = planPlayback([
      { id: "1", label: "bell", soundSrc: "bell.mp3" },
    ]);

    expect(steps).toEqual([
      { kind: "audio", trackingKey: "1", src: "bell.mp3" },
    ]);
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
      "audio",
      "speech",
    ]);
  });

  test("speaks the vocalization rather than the label when present", () => {
    const steps = planPlayback([
      { id: "1", label: "🙂", vocalization: "Happy" },
    ]);

    expect(steps[0].kind === "speech" && steps[0].text).toBe("happy");
  });

  test("skips parts with no spoken text, such as inserted spaces", () => {
    const steps = planPlayback([
      { id: "1", label: "hi" },
      { id: "2", label: "" },
    ]);

    expect(steps).toHaveLength(1);
    expect(steps[0].kind === "speech" && steps[0].text).toBe("hi");
  });
});
