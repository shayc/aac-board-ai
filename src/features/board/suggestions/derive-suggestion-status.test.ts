import type { Status } from "@shayc/react-built-in-ai";
import { describe, expect, test } from "vitest";
import {
  deriveSuggestionStatus,
  type SuggestionStatusInput,
} from "./derive-suggestion-status";

type SourceInput = SuggestionStatusInput["sources"][number];

function makeSource(overrides: Partial<SourceInput> = {}): SourceInput {
  return {
    engineStatus: "ready",
    isRequestPending: false,
    hasRequestFailed: false,
    ...overrides,
  };
}

function makeSources(...engineStatuses: Status[]): SourceInput[] {
  return engineStatuses.map((engineStatus) => makeSource({ engineStatus }));
}

function makeInput(
  overrides: Partial<SuggestionStatusInput> = {},
): SuggestionStatusInput {
  return {
    sources: makeSources("ready", "ready"),
    downloadProgress: null,
    hasText: false,
    phraseCount: 0,
    ...overrides,
  };
}

describe("deriveSuggestionStatus", () => {
  test("stays quiet when everything is healthy and idle", () => {
    expect(deriveSuggestionStatus(makeInput())).toBeNull();
  });

  test("stays quiet when no engine is supported", () => {
    const input = makeInput({
      sources: makeSources("unsupported", "unsupported"),
      hasText: true,
    });

    expect(deriveSuggestionStatus(input)).toBeNull();
  });

  test("asks for setup ahead of any download state", () => {
    const input = makeInput({
      sources: makeSources("downloadable", "ready"),
      downloadProgress: 0.5,
    });

    expect(deriveSuggestionStatus(input)).toEqual({
      kind: "not-enabled",
    });
  });

  test("reports download progress while a model downloads", () => {
    const input = makeInput({ downloadProgress: 0.43 });

    expect(deriveSuggestionStatus(input)).toEqual({
      kind: "downloading",
      percent: 43,
    });
  });

  test("treats a download without measurable progress as indeterminate", () => {
    expect(deriveSuggestionStatus(makeInput({ downloadProgress: 0 }))).toEqual({
      kind: "downloading",
      percent: null,
    });
    expect(
      deriveSuggestionStatus(makeInput({ downloadProgress: 0.004 })),
    ).toEqual({
      kind: "downloading",
      percent: null,
    });
  });

  test("shows pending while any request is in flight, even with phrases showing", () => {
    const sources = [makeSource({ isRequestPending: true }), makeSource()];

    expect(deriveSuggestionStatus(makeInput({ sources }))).toEqual({
      kind: "pending",
    });
    expect(
      deriveSuggestionStatus(makeInput({ sources, phraseCount: 1 })),
    ).toEqual({
      kind: "pending",
    });
  });

  test("announces unavailability only when every engine is out and nothing was suggested", () => {
    const input = makeInput({
      sources: makeSources("unavailable", "error"),
      hasText: true,
    });

    expect(deriveSuggestionStatus(input)).toEqual({ kind: "unavailable" });
  });

  test("counts a failed request as a broken engine", () => {
    const input = makeInput({
      sources: [
        makeSource({ hasRequestFailed: true }),
        makeSource({ engineStatus: "unavailable" }),
      ],
      hasText: true,
    });

    expect(deriveSuggestionStatus(input)).toEqual({ kind: "unavailable" });
  });

  test("partial failure stays silent while one engine still works", () => {
    const input = makeInput({
      sources: [makeSource({ hasRequestFailed: true }), makeSource()],
      hasText: true,
    });

    expect(deriveSuggestionStatus(input)).toBeNull();
  });

  test("an engine still probing availability is not a failure", () => {
    const input = makeInput({
      sources: makeSources("checking", "unavailable"),
      hasText: true,
    });

    expect(deriveSuggestionStatus(input)).toBeNull();
  });
});
