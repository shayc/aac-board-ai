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
  test("returns idle when every engine is ready", () => {
    expect(deriveSuggestionStatus(makeInput())).toEqual({ kind: "idle" });
  });

  test("returns idle when no engine is supported", () => {
    const input = makeInput({
      sources: makeSources("unsupported", "unsupported"),
      hasText: true,
    });

    expect(deriveSuggestionStatus(input)).toEqual({ kind: "idle" });
  });

  test("returns not-enabled while any engine is downloadable, even mid-download", () => {
    const input = makeInput({
      sources: makeSources("downloadable", "ready"),
      downloadProgress: 0.5,
    });

    expect(deriveSuggestionStatus(input)).toEqual({
      kind: "not-enabled",
    });
  });

  test("returns not-enabled while any engine is in error, so enabling retries it", () => {
    const input = makeInput({
      sources: makeSources("error", "ready"),
      hasText: true,
      phraseCount: 1,
    });

    expect(deriveSuggestionStatus(input)).toEqual({ kind: "not-enabled" });
  });

  test("returns downloading with the percent while a model downloads", () => {
    const input = makeInput({ downloadProgress: 0.43 });

    expect(deriveSuggestionStatus(input)).toEqual({
      kind: "downloading",
      percent: 43,
    });
  });

  test("returns downloading without a percent when progress rounds to zero", () => {
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

  test("returns pending while any request is in flight, even with phrases showing", () => {
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

  test("returns unavailable only when there is text, every engine is down, and nothing was suggested", () => {
    const allEnginesDown = makeInput({
      sources: makeSources("unavailable", "unavailable"),
      hasText: true,
    });

    expect(deriveSuggestionStatus(allEnginesDown)).toEqual({
      kind: "unavailable",
    });
    expect(
      deriveSuggestionStatus({ ...allEnginesDown, hasText: false }),
    ).toEqual({ kind: "idle" });
    expect(
      deriveSuggestionStatus({ ...allEnginesDown, phraseCount: 1 }),
    ).toEqual({ kind: "idle" });
  });

  test("returns unavailable when a failed request leaves no working engine", () => {
    const input = makeInput({
      sources: [
        makeSource({ hasRequestFailed: true }),
        makeSource({ engineStatus: "unavailable" }),
      ],
      hasText: true,
    });

    expect(deriveSuggestionStatus(input)).toEqual({ kind: "unavailable" });
  });

  test("returns idle after a failed request while another engine still works", () => {
    const input = makeInput({
      sources: [makeSource({ hasRequestFailed: true }), makeSource()],
      hasText: true,
    });

    expect(deriveSuggestionStatus(input)).toEqual({ kind: "idle" });
  });

  test("returns idle while an engine is still checking availability", () => {
    const input = makeInput({
      sources: makeSources("checking", "unavailable"),
      hasText: true,
    });

    expect(deriveSuggestionStatus(input)).toEqual({ kind: "idle" });
  });
});
