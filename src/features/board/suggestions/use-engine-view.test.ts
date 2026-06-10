import { MissingUserActivationError } from "@shayc/react-built-in-ai";
import { describe, expect, test } from "vitest";
import { deriveEngineView, type EngineSnapshot } from "./use-engine-view";

function makeEngine(overrides: Partial<EngineSnapshot> = {}): EngineSnapshot {
  return { status: "idle", progress: 0, error: null, ...overrides };
}

describe("deriveEngineView", () => {
  test.each([
    [
      "unsupported",
      makeEngine({ status: "unsupported" }),
      undefined,
      "unsupported",
    ],
    ["ready", makeEngine({ status: "ready" }), undefined, "ready"],
    [
      "unavailable",
      makeEngine({ status: "unavailable" }),
      undefined,
      "unavailable",
    ],
  ] as const)(
    "maps terminal status %s straight through",
    (_label, engine, availability, kind) => {
      expect(deriveEngineView(engine, availability)).toEqual({ kind });
    },
  );

  test("carries progress through the downloading state", () => {
    const view = deriveEngineView(
      makeEngine({ status: "downloading", progress: 0.6 }),
      undefined,
    );

    expect(view).toEqual({ kind: "downloading", progress: 0.6 });
  });

  test("treats idle plus a downloadable model as awaiting the user gesture", () => {
    const view = deriveEngineView(makeEngine(), "downloadable");

    expect(view).toEqual({ kind: "awaits-gesture" });
  });

  test.each([
    ["still probing", undefined],
    ["model already present", "available"],
  ] as const)(
    "treats idle as initializing while %s",
    (_label, availability) => {
      expect(deriveEngineView(makeEngine(), availability)).toEqual({
        kind: "initializing",
      });
    },
  );

  test("treats a missing-activation error as awaiting the gesture", () => {
    const view = deriveEngineView(
      makeEngine({ status: "error", error: new MissingUserActivationError() }),
      undefined,
    );

    expect(view).toEqual({ kind: "awaits-gesture" });
  });

  test("treats any other lifecycle error as unavailable", () => {
    const view = deriveEngineView(
      makeEngine({ status: "error", error: null }),
      undefined,
    );

    expect(view).toEqual({ kind: "unavailable" });
  });
});
