import { describe, expect, test } from "vitest";
import {
  deriveSuggestionStatus,
  type SuggestionStatusInput,
} from "./derive-suggestion-status";
import type { EngineView } from "@shared/built-in-ai/engine-view";

function makeInput(
  overrides: Partial<SuggestionStatusInput> = {},
): SuggestionStatusInput {
  return {
    engines: [
      { view: { kind: "ready" }, requestFailed: false },
      { view: { kind: "ready" }, requestFailed: false },
    ],
    downloadProgress: null,
    hasText: false,
    isPending: false,
    phraseCount: 0,
    ...overrides,
  };
}

function engines(...views: EngineView[]) {
  return views.map((view) => ({ view, requestFailed: false }));
}

describe("deriveSuggestionStatus", () => {
  test("stays quiet when everything is healthy and idle", () => {
    expect(deriveSuggestionStatus(makeInput())).toBeNull();
  });

  test("stays quiet when no engine is supported", () => {
    const input = makeInput({
      engines: engines({ kind: "unsupported" }, { kind: "unsupported" }),
      hasText: true,
    });

    expect(deriveSuggestionStatus(input)).toBeNull();
  });

  test("asks for activation ahead of any download state", () => {
    const input = makeInput({
      engines: engines({ kind: "awaits-gesture" }, { kind: "ready" }),
      downloadProgress: 0.5,
    });

    expect(deriveSuggestionStatus(input)).toEqual({
      kind: "needs-activation",
    });
  });

  test("reports download progress while a model downloads", () => {
    const input = makeInput({ downloadProgress: 0.43 });

    expect(deriveSuggestionStatus(input)).toEqual({
      kind: "downloading",
      progress: 0.43,
    });
  });

  test("shows pending only while no phrases have arrived", () => {
    expect(deriveSuggestionStatus(makeInput({ isPending: true }))).toEqual({
      kind: "pending",
    });
    expect(
      deriveSuggestionStatus(makeInput({ isPending: true, phraseCount: 1 })),
    ).toBeNull();
  });

  test("announces unavailability only when every engine is out and nothing was suggested", () => {
    const input = makeInput({
      engines: engines({ kind: "unavailable" }, { kind: "unavailable" }),
      hasText: true,
    });

    expect(deriveSuggestionStatus(input)).toEqual({ kind: "unavailable" });
  });

  test("counts a failed request as a broken engine", () => {
    const input = makeInput({
      engines: [
        { view: { kind: "ready" }, requestFailed: true },
        { view: { kind: "unavailable" }, requestFailed: false },
      ],
      hasText: true,
    });

    expect(deriveSuggestionStatus(input)).toEqual({ kind: "unavailable" });
  });

  test("partial failure stays silent while one engine still works", () => {
    const input = makeInput({
      engines: [
        { view: { kind: "ready" }, requestFailed: true },
        { view: { kind: "ready" }, requestFailed: false },
      ],
      hasText: true,
    });

    expect(deriveSuggestionStatus(input)).toBeNull();
  });

  test("an initializing engine is not a failure", () => {
    const input = makeInput({
      engines: engines({ kind: "initializing" }, { kind: "unavailable" }),
      hasText: true,
    });

    expect(deriveSuggestionStatus(input)).toBeNull();
  });
});
