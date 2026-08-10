import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import {
  parseBoardSuggestionConfig,
  setSuggestionCustomInstructions,
  useBoardSuggestionConfig,
} from "./suggestion-config-store";

describe("suggestion-config-store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("parseBoardSuggestionConfig", () => {
    test("defaults custom instructions to an empty string", () => {
      expect(parseBoardSuggestionConfig(undefined).customInstructions).toBe("");
    });

    test("ignores non-string custom instructions", () => {
      expect(
        parseBoardSuggestionConfig({ customInstructions: true })
          .customInstructions,
      ).toBe("");
    });

    test("keeps stored custom instructions", () => {
      expect(
        parseBoardSuggestionConfig({ customInstructions: "Be concise" })
          .customInstructions,
      ).toBe("Be concise");
    });
  });

  test("updates the snapshot and persists it", async () => {
    const { result, rerender } = await renderHook(() =>
      useBoardSuggestionConfig(),
    );

    setSuggestionCustomInstructions("Be concise");
    await rerender();

    expect(result.current.customInstructions).toBe("Be concise");
    await vi.waitFor(() =>
      expect(localStorage.getItem("board-suggestions")).toBe(
        JSON.stringify({ customInstructions: "Be concise" }),
      ),
    );
  });
});
