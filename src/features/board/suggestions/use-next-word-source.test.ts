import { stubLanguageModel } from "@shared/testing/stub-built-in-ai";
import { describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useNextWordSource } from "./use-next-word-source";

const WORDS = ["I", "want", "to", "eat", "more"];

// The board session outlives a render, so each test gets its own board.
function renderNextWordSource(board: string, text: string, isWordOpen = false) {
  return renderHook(() =>
    useNextWordSource({
      text,
      vocabulary: [...WORDS, board],
      isWordOpen,
      language: "en",
    }),
  );
}

describe("useNextWordSource", () => {
  test("predicts the next words from the board's vocabulary", async () => {
    stubLanguageModel(() => '{"words":["to","more","eat"]}');

    const { result } = await renderNextWordSource("predicts", "I want");

    await vi.waitFor(() => {
      expect(result.current.words).toEqual(["to", "more", "eat"]);
    });
  });

  test("predicts nothing while a word is still being spelled", async () => {
    const languageModel = stubLanguageModel(() => '{"words":["to"]}');

    const { result } = await renderNextWordSource("spelling", "I wa", true);

    await vi.waitFor(() => {
      expect(result.current.engineStatus).toBe("ready");
    });
    expect(languageModel.prompt).not.toHaveBeenCalled();
    expect(result.current.words).toEqual([]);
  });

  test("reuses the answer for a sentence it has already predicted", async () => {
    const languageModel = stubLanguageModel(
      () => '{"words":["eat","to","more"]}',
    );

    const first = await renderNextWordSource("reuses", "I want more");
    await vi.waitFor(() => {
      expect(first.result.current.words).toEqual(["eat", "to", "more"]);
    });
    await first.unmount();

    languageModel.prompt.mockReturnValue('{"words":["I","want","to"]}');
    const second = await renderNextWordSource("reuses", "I want more");

    await vi.waitFor(() => {
      expect(second.result.current.words).toEqual(["eat", "to", "more"]);
    });
    expect(languageModel.prompt).toHaveBeenCalledOnce();
  });

  test("asks again when the model had no board words to offer", async () => {
    const languageModel = stubLanguageModel(() => '{"words":["fly"]}');

    const first = await renderNextWordSource("retries", "I eat");
    await vi.waitFor(() => {
      expect(languageModel.prompt).toHaveBeenCalledOnce();
    });
    await first.unmount();

    languageModel.prompt.mockReturnValue('{"words":["more"]}');
    const second = await renderNextWordSource("retries", "I eat");

    await vi.waitFor(() => {
      expect(second.result.current.words).toEqual(["more"]);
    });
  });
});
