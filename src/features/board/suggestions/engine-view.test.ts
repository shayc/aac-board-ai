import { describe, expect, test } from "vitest";
import { deriveEngineView, type EngineSnapshot } from "./engine-view";

function makeEngine(overrides: Partial<EngineSnapshot> = {}): EngineSnapshot {
  return { status: "idle", progress: 0, error: null, ...overrides };
}

describe("deriveEngineView", () => {
  test.each([
    ["unsupported", "unsupported"],
    ["ready", "ready"],
    ["unavailable", "unavailable"],
    ["error", "unavailable"],
    ["downloadable", "awaits-gesture"],
    ["idle", "initializing"],
  ] as const)("maps status %s to %s", (status, kind) => {
    expect(deriveEngineView(makeEngine({ status }))).toEqual({ kind });
  });

  test("carries progress through the downloading state", () => {
    const view = deriveEngineView(
      makeEngine({ status: "downloading", progress: 0.6 }),
    );

    expect(view).toEqual({ kind: "downloading", progress: 0.6 });
  });
});
