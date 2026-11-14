import type { PlaybackStep } from "@shared/playback/playback-types";
import { describe, expect, test } from "vitest";
import { createTilePart } from "../message/message-transforms";
import type { MessagePart } from "../message/message-types";
import { planPlayback } from "./plan-playback";

describe("planPlayback", () => {
  test("returns no steps for an empty message", () => {
    expect(planPlayback([])).toEqual([]);
  });

  test("merges a run of tile and text parts into a single speech step", () => {
    const parts: MessagePart[] = [
      { kind: "tile", id: "1", label: "I" },
      { kind: "text", id: "2", label: "Want" },
    ];

    const steps = planPlayback(parts);

    const step = getOnlySpeechStep(steps);

    expect(step.text).toBe("i want");
    expect(step.cueAt?.(2)).toBe("2");
  });

  test("normalizes whitespace and maps speech offsets to their message parts", () => {
    const steps = planPlayback([
      { kind: "text", id: "1", label: " I " },
      { kind: "text", id: "2", label: "want   a " },
      { kind: "text", id: "3", label: " cookie" },
    ]);

    const step = getOnlySpeechStep(steps);

    expect(step.text).toBe("i want a cookie");
    expect(step.cueAt?.(0)).toBe("1");
    expect(step.cueAt?.(2)).toBe("2");
    expect(step.cueAt?.(7)).toBe("2");
    expect(step.cueAt?.(9)).toBe("3");
    expect(step.cueAt?.(99)).toBeNull();
  });

  test("emits a sound part as its own step carrying its part id", () => {
    const part = createTilePart({ label: "", soundSrc: "bell.mp3" });
    const steps = planPlayback([part]);

    expect(steps).toEqual([{ kind: "audio", cue: part.id, src: "bell.mp3" }]);
  });

  test("preserves order when a sound breaks a text run", () => {
    const parts: MessagePart[] = [
      { kind: "tile", id: "1", label: "hello" },
      { kind: "tile", id: "2", label: "ding", soundSrc: "ding.mp3" },
      { kind: "tile", id: "3", label: "world" },
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
      { kind: "tile", id: "1", label: "🙂", vocalization: "Happy" },
    ]);

    const step = getOnlySpeechStep(steps);

    expect(step.text).toBe("happy");
  });

  test("skips parts with no spoken text", () => {
    const steps = planPlayback([
      { kind: "tile", id: "1", label: "hi" },
      { kind: "tile", id: "2", label: "" },
    ]);

    const step = getOnlySpeechStep(steps);

    expect(step.text).toBe("hi");
  });

  test.each([
    { source: "label", part: { kind: "tile", id: "1", label: " " } },
    {
      source: "vocalization",
      part: { kind: "tile", id: "1", label: "hello", vocalization: " \t" },
    },
  ] as const)("returns no steps for a whitespace-only $source", ({ part }) => {
    expect(planPlayback([part])).toEqual([]);
  });

  test("skips whitespace-only parts within and at the end of a speech run", () => {
    const steps = planPlayback([
      { kind: "tile", id: "1", label: "hello" },
      { kind: "tile", id: "2", label: " " },
      { kind: "tile", id: "3", label: "world" },
      { kind: "tile", id: "4", label: "goodbye", vocalization: " " },
    ]);

    const step = getOnlySpeechStep(steps);

    expect(step.text).toBe("hello world");
    expect(step.cueAt?.(6)).toBe("3");
  });
});

type SpeechStep = Extract<PlaybackStep, { kind: "speech" }>;

function getOnlySpeechStep(steps: readonly PlaybackStep[]): SpeechStep {
  const [step] = steps;
  if (steps.length !== 1 || step?.kind !== "speech") {
    const kinds = steps.map(({ kind }) => kind).join(", ");

    throw new Error(`Expected a single speech step, got [${kinds}]`);
  }

  return step;
}
