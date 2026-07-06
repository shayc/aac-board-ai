import { LanguageProvider } from "@shared/language/language-provider";
import {
  DEFAULT_LANGUAGE,
  setStoredLanguage,
} from "@shared/language/language-store";
import {
  stubBuiltInAIUnsupported,
  stubLanguageModel,
} from "@shared/testing/built-in-ai";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import type { Board, BoardButton } from "../types";
import { PREDICTION_SYSTEM_PROMPT } from "./prediction-prompt";
import { useTilePrediction } from "./use-tile-prediction";

function makeBoard(words: string[]): Board {
  const buttons: BoardButton[] = words.map((label, i) => ({
    id: `b${i}`,
    label,
  }));

  return {
    id: "test-board",
    grid: { rows: 1, columns: words.length },
    buttons,
  };
}

const FOOD_BOARD = makeBoard(["eat", "drink", "more", "help", "stop"]);

function renderTilePrediction(text: string, board: Board = FOOD_BOARD) {
  return renderHook(() => useTilePrediction(text, board), {
    wrapper: LanguageProvider,
  });
}

describe("useTilePrediction", () => {
  beforeEach(() => {
    setStoredLanguage(DEFAULT_LANGUAGE);
  });

  test("assembles the sentence-so-far plus the predicted next words", async () => {
    stubLanguageModel(() => '{"words":["more","help"]}');

    const { result } = await renderTilePrediction("I want");

    await vi.waitFor(() => {
      expect(result.current.phrase).toBe("I want more help");
    });
  });

  test("provisions the session with the system prompt and expected languages", async () => {
    const { create } = stubLanguageModel();

    await renderTilePrediction("I want");

    await vi.waitFor(() => {
      expect(create.mock.calls.at(0)?.at(0)).toMatchObject({
        initialPrompts: [{ role: "system", content: PREDICTION_SYSTEM_PROMPT }],
        expectedInputs: [{ type: "text", languages: ["en"] }],
        expectedOutputs: [{ type: "text", languages: ["en"] }],
      });
    });
  });

  test("constrains the response to the prediction schema", async () => {
    const { prompt } = stubLanguageModel();

    await renderTilePrediction("I want");

    await vi.waitFor(() => {
      expect(prompt.mock.calls.at(0)?.at(1)).toMatchObject({
        responseConstraint: { type: "object", required: ["words"] },
      });
    });
  });

  test("reports unsupported and stays empty when the Prompt API is unavailable", async () => {
    stubBuiltInAIUnsupported("LanguageModel");

    const { result } = await renderTilePrediction("I want");

    await vi.waitFor(() => {
      expect(result.current.status).toBe("unsupported");
    });
    expect(result.current.phrase).toBeUndefined();
  });

  test("stays quiet when the board has no word tiles", async () => {
    const { prompt } = stubLanguageModel();
    const foldersOnly = makeBoard([]);

    const { result } = await renderTilePrediction("I want", foldersOnly);

    await vi.waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    expect(prompt).not.toHaveBeenCalled();
    expect(result.current.phrase).toBeUndefined();
  });

  test("ignores a stale in-flight prediction when the text changes mid-flight", async () => {
    const resolvers = new Map<string, (raw: string) => void>();
    stubLanguageModel(
      (input) =>
        new Promise<string>((resolve) => {
          const sentence = input.includes("(empty)")
            ? "(empty)"
            : (/Sentence so far: (.+)/.exec(input)?.[1] ?? input);
          resolvers.set(sentence, resolve);
        }),
    );

    const { result, rerender } = await renderHook(
      ({ text }: { text: string } = { text: "I want" }) =>
        useTilePrediction(text, FOOD_BOARD),
      { initialProps: { text: "I want" }, wrapper: LanguageProvider },
    );

    await vi.waitFor(() => {
      expect(resolvers.has("I want")).toBe(true);
    });

    await rerender({ text: "I want more" });
    await vi.waitFor(() => {
      expect(resolvers.has("I want more")).toBe(true);
    });

    resolvers.get("I want more")?.('{"words":["help"]}');
    resolvers.get("I want")?.('{"words":["eat"]}');

    await vi.waitFor(() => {
      expect(result.current.phrase).toBe("I want more help");
    });
  });

  test("withholds the chip while the live text is ahead of the debounced prediction", async () => {
    stubLanguageModel(() => '{"words":["eat"]}');

    const { result, rerender } = await renderHook(
      ({ text }: { text: string } = { text: "I want" }) =>
        useTilePrediction(text, FOOD_BOARD),
      { initialProps: { text: "I want" }, wrapper: LanguageProvider },
    );

    await vi.waitFor(() => {
      expect(result.current.phrase).toBe("I want eat");
    });

    // A fresh keystroke: the words still describe "I want", so the chip must
    // not splice them onto the newer text until the prediction catches up.
    await rerender({ text: "I want to" });
    expect(result.current.phrase).toBeUndefined();

    await vi.waitFor(() => {
      expect(result.current.phrase).toBe("I want to eat");
    });
  });
});
