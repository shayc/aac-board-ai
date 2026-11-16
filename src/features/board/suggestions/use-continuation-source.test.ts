import { stubLanguageModel } from "@shared/testing/stub-built-in-ai";
import { describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useContinuationSource } from "./use-continuation-source";

const WORDS = ["I", "want", "to", "eat", "more", "now"];

// The board session outlives a render, so each test gets its own board.
function renderContinuationSource(
  board: string,
  text: string,
  isWordOpen = false,
) {
  return renderHook(() =>
    useContinuationSource({
      text,
      vocabulary: [...WORDS, board],
      isWordOpen,
      language: "en",
    }),
  );
}

describe("useContinuationSource", () => {
  test("predicts continuations from the nearby vocabulary", async () => {
    stubLanguageModel(() => modelAnswer("I want", ["to eat", "more now"]));

    const { result } = await renderContinuationSource("predicts", "I want");

    await vi.waitFor(() => {
      expect(result.current.continuations).toEqual([
        ["to", "eat"],
        ["more", "now"],
      ]);
    });
  });

  test("offers nothing when the model only finds a single word", async () => {
    const languageModel = stubLanguageModel(() =>
      modelAnswer("I eat", ["more"]),
    );

    const { result } = await renderContinuationSource("single", "I eat");

    await vi.waitFor(() => {
      expect(languageModel.prompt).toHaveBeenCalledOnce();
    });
    expect(result.current.continuations).toEqual([]);
  });

  test("predicts nothing while a word is still being spelled", async () => {
    const languageModel = stubLanguageModel(() =>
      modelAnswer("I wa", ["to eat"]),
    );

    const { result } = await renderContinuationSource("spelling", "I wa", true);

    await vi.waitFor(() => {
      expect(result.current.engineStatus).toBe("ready");
    });
    expect(languageModel.prompt).not.toHaveBeenCalled();
    expect(result.current.continuations).toEqual([]);
  });

  test("prepares the board's session before there is a sentence", async () => {
    const languageModel = stubLanguageModel(() =>
      modelAnswer("I", ["want to"]),
    );

    await renderContinuationSource("prepares", "");

    // The board's words only reach the model through its session's prefix.
    await vi.waitFor(() => {
      expect(JSON.stringify(languageModel.create.mock.calls)).toContain(
        "prepares",
      );
    });
    expect(languageModel.prompt).not.toHaveBeenCalled();
  });

  test("reuses the answer for a sentence it has already predicted", async () => {
    const languageModel = stubLanguageModel(() =>
      modelAnswer("I want more", ["to eat"]),
    );

    const first = await renderContinuationSource("reuses", "I want more");
    await vi.waitFor(() => {
      expect(first.result.current.continuations).toEqual([["to", "eat"]]);
    });
    await first.unmount();

    languageModel.prompt.mockReturnValue(
      modelAnswer("I want more", ["I want"]),
    );
    const second = await renderContinuationSource("reuses", "I want more");

    await vi.waitFor(() => {
      expect(second.result.current.continuations).toEqual([["to", "eat"]]);
    });
    expect(languageModel.prompt).toHaveBeenCalledOnce();
  });
});

function modelAnswer(text: string, additions: readonly string[]): string {
  return JSON.stringify({
    sentences: additions.map((added) => `${text} ${added}`),
  });
}
