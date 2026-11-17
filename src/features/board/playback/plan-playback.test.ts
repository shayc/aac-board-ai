import type { PlaybackStep, SpeechStep } from "@shared/playback/playback-types";
import { describe, expect, test } from "vitest";
import { createTilePart } from "../message/message-transforms";
import type { MessagePart } from "../message/message-types";
import { planPlayback } from "./plan-playback";

describe("planPlayback", () => {
  test("returns no steps for an empty message", () => {
    expect(planPlayback([], "en")).toEqual([]);
  });

  test("merges a run of tile and text parts into a single speech step", () => {
    const parts: MessagePart[] = [
      { kind: "tile", id: "1", label: "I", language: "en" },
      { kind: "text", id: "2", label: "Want", language: "en" },
    ];

    const steps = planPlayback(parts, "en");

    const step = getOnlySpeechStep(steps);

    expect(step.text).toBe("i want");
    expect(step.cueAt?.(2)).toBe("2");
  });

  test("starts a new speech step where the language changes", () => {
    const steps = planPlayback(
      [
        { kind: "tile", id: "1", label: "I", language: "en" },
        { kind: "tile", id: "2", label: "want", language: "en" },
        { kind: "text", id: "3", label: "מים", language: "he" },
        { kind: "text", id: "4", label: "please", language: "en" },
      ],
      "en",
    );

    expect(steps).toMatchObject([
      { kind: "speech", text: "i want", language: "en" },
      { kind: "speech", text: "מים", language: "he", cue: "3" },
      { kind: "speech", text: "please", language: "en", cue: "4" },
    ]);
  });

  test("speaks text in an unknown language in the same step as the communication language", () => {
    const steps = planPlayback(
      [
        { kind: "tile", id: "1", label: "אני", language: "he" },
        { kind: "text", id: "2", label: "רוצה", language: undefined },
        { kind: "tile", id: "3", label: "מים", language: "he" },
      ],
      "he",
    );

    expect(steps).toMatchObject([
      { kind: "speech", text: "אני רוצה מים", language: "he" },
    ]);
  });

  test("normalizes whitespace and maps speech offsets to their message parts", () => {
    const steps = planPlayback(
      [
        { kind: "text", id: "1", label: " I ", language: "en" },
        { kind: "text", id: "2", label: "want   a ", language: "en" },
        { kind: "text", id: "3", label: " cookie", language: "en" },
      ],
      "en",
    );

    const step = getOnlySpeechStep(steps);

    expect(step.text).toBe("i want a cookie");
    expect(step.cueAt?.(0)).toBe("1");
    expect(step.cueAt?.(1)).toBe("2");
    expect(step.cueAt?.(2)).toBe("2");
    expect(step.cueAt?.(7)).toBe("2");
    expect(step.cueAt?.(8)).toBe("3");
    expect(step.cueAt?.(9)).toBe("3");
    expect(step.cueAt?.(99)).toBeNull();
  });

  test("emits a sound part as its own step carrying its part ID", () => {
    const part = createTilePart({
      label: "",
      soundSrc: "bell.mp3",
      language: "en",
    });
    const steps = planPlayback([part], "en");

    expect(steps).toEqual([{ kind: "audio", cue: part.id, src: "bell.mp3" }]);
  });

  test("gives a sound part its spoken text to fall back on", () => {
    const steps = planPlayback(
      [
        {
          kind: "tile",
          id: "1",
          label: "Dog",
          language: "en",
          soundSrc: "bark.mp3",
        },
        {
          kind: "tile",
          id: "2",
          label: "🙂",
          language: "en",
          vocalization: " Very  happy ",
          soundSrc: "laugh.mp3",
        },
      ],
      "en",
    );

    expect(steps).toEqual([
      {
        kind: "audio",
        cue: "1",
        src: "bark.mp3",
        fallback: { text: "dog", language: "en" },
      },
      {
        kind: "audio",
        cue: "2",
        src: "laugh.mp3",
        fallback: { text: "very happy", language: "en" },
      },
    ]);
  });

  test("gives a sound part's fallback text the part's language", () => {
    const steps = planPlayback(
      [
        {
          kind: "tile",
          id: "1",
          label: "Dog",
          language: "en",
          soundSrc: "bark.mp3",
        },
      ],
      "en",
    );

    expect(steps).toMatchObject([
      { kind: "audio", fallback: { text: "dog", language: "en" } },
    ]);
  });

  test("gives a sound part without spoken text nothing to fall back on", () => {
    const steps = planPlayback(
      [
        {
          kind: "tile",
          id: "1",
          label: " ",
          language: "en",
          soundSrc: "bell.mp3",
        },
      ],
      "en",
    );

    expect(steps).toEqual([{ kind: "audio", cue: "1", src: "bell.mp3" }]);
  });

  test("preserves order when a sound breaks a text run", () => {
    const parts: MessagePart[] = [
      { kind: "tile", id: "1", label: "hello", language: "en" },
      {
        kind: "tile",
        id: "2",
        label: "ding",
        language: "en",
        soundSrc: "ding.mp3",
      },
      { kind: "tile", id: "3", label: "world", language: "en" },
    ];

    const steps = planPlayback(parts, "en");

    expect(steps.map((step) => step.kind)).toEqual([
      "speech",
      "audio",
      "speech",
    ]);
  });

  test("speaks the vocalization rather than the label when present", () => {
    const steps = planPlayback(
      [
        {
          kind: "tile",
          id: "1",
          label: "🙂",
          language: "en",
          vocalization: "Happy",
        },
      ],
      "en",
    );

    const step = getOnlySpeechStep(steps);

    expect(step.text).toBe("happy");
  });

  test("skips parts with no spoken text", () => {
    const steps = planPlayback(
      [
        { kind: "tile", id: "1", label: "hi", language: "en" },
        { kind: "tile", id: "2", label: "", language: "en" },
      ],
      "en",
    );

    const step = getOnlySpeechStep(steps);

    expect(step.text).toBe("hi");
  });

  test.each([
    {
      source: "label",
      part: { kind: "tile", id: "1", label: " ", language: "en" },
    },
    {
      source: "vocalization",
      part: {
        kind: "tile",
        id: "1",
        label: "hello",
        language: "en",
        vocalization: " \t",
      },
    },
  ] as const)("returns no steps for a whitespace-only $source", ({ part }) => {
    expect(planPlayback([part], "en")).toEqual([]);
  });

  test("skips whitespace-only parts within and at the end of a speech run", () => {
    const steps = planPlayback(
      [
        { kind: "tile", id: "1", label: "hello", language: "en" },
        { kind: "tile", id: "2", label: " ", language: "en" },
        { kind: "tile", id: "3", label: "world", language: "en" },
        {
          kind: "tile",
          id: "4",
          label: "goodbye",
          language: "en",
          vocalization: " ",
        },
      ],
      "en",
    );

    const step = getOnlySpeechStep(steps);

    expect(step.text).toBe("hello world");
    expect(step.cueAt?.(6)).toBe("3");
  });
});

function getOnlySpeechStep(steps: readonly PlaybackStep[]): SpeechStep {
  const [step] = steps;
  if (steps.length !== 1 || step?.kind !== "speech") {
    const kinds = steps.map(({ kind }) => kind).join(", ");

    throw new Error(`Expected a single speech step, got [${kinds}]`);
  }

  return step;
}
