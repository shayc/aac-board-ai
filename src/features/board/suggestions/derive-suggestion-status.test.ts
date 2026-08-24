import type { Status } from "@shayc/react-built-in-ai";
import { describe, expect, test } from "vitest";
import {
  deriveSuggestionStatus,
  type SuggestionStatusInput,
} from "./derive-suggestion-status";

function makeInput(
  overrides: Partial<SuggestionStatusInput> = {},
): SuggestionStatusInput {
  return {
    engines: [
      { status: "ready", requestFailed: false },
      { status: "ready", requestFailed: false },
    ],
    downloadProgress: null,
    hasText: false,
    isPending: false,
    phraseCount: 0,
    ...overrides,
  };
}

function engines(...statuses: Status[]) {
  return statuses.map((status) => ({ status, requestFailed: false }));
}

describe("deriveSuggestionStatus", () => {
  test("stays quiet when everything is healthy and idle", () => {
    expect(deriveSuggestionStatus(makeInput())).toBeNull();
  });

  test("stays quiet when no engine is supported", () => {
    const input = makeInput({
      engines: engines("unsupported", "unsupported"),
      hasText: true,
    });

    expect(deriveSuggestionStatus(input)).toBeNull();
  });

  test("asks for activation ahead of any download state", () => {
    const input = makeInput({
      engines: engines("downloadable", "ready"),
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
    expect(deriveSuggestionStatus(makeInput({ isPending: true }))).toEqual({
      kind: "pending",
    });
    expect(
      deriveSuggestionStatus(makeInput({ isPending: true, phraseCount: 1 })),
    ).toEqual({
      kind: "pending",
    });
  });

  test("announces unavailability only when every engine is out and nothing was suggested", () => {
    const input = makeInput({
      engines: engines("unavailable", "error"),
      hasText: true,
    });

    expect(deriveSuggestionStatus(input)).toEqual({ kind: "unavailable" });
  });

  test("counts a failed request as a broken engine", () => {
    const input = makeInput({
      engines: [
        { status: "ready", requestFailed: true },
        { status: "unavailable", requestFailed: false },
      ],
      hasText: true,
    });

    expect(deriveSuggestionStatus(input)).toEqual({ kind: "unavailable" });
  });

  test("partial failure stays silent while one engine still works", () => {
    const input = makeInput({
      engines: [
        { status: "ready", requestFailed: true },
        { status: "ready", requestFailed: false },
      ],
      hasText: true,
    });

    expect(deriveSuggestionStatus(input)).toBeNull();
  });

  test("an engine still probing availability is not a failure", () => {
    const input = makeInput({
      engines: engines("checking", "unavailable"),
      hasText: true,
    });

    expect(deriveSuggestionStatus(input)).toBeNull();
  });
});
