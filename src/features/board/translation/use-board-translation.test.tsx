import { LanguageProvider } from "@shared/language/language-provider";
import { useLanguage } from "@shared/language/use-language";
import {
  stubBuiltInAIUnsupported,
  stubTranslator,
} from "@shared/testing/built-in-ai";
import { describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import type { Board } from "../types";
import {
  useBoardTranslation,
  type UseBoardTranslationOptions,
} from "./use-board-translation";

function makeBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: "board-1",
    name: "Food",
    locale: "en-US",
    grid: { rows: 1, columns: 2 },
    buttons: [
      { id: "btn-eat", label: "eat", vocalization: "eat" },
      { id: "btn-drink", label: "drink" },
    ],
    ...overrides,
  };
}

function useTranslationHarness(options: UseBoardTranslationOptions) {
  const translation = useBoardTranslation(options);
  const { setLanguage } = useLanguage();

  return { translation, setLanguage };
}

function setup(board: Board, language?: string) {
  if (language) {
    localStorage.setItem("language", JSON.stringify(language));
  }

  return renderHook(() => useTranslationHarness({ setId: "set-1", board }), {
    wrapper: LanguageProvider,
  });
}

describe("useBoardTranslation", () => {
  test("returns the board unchanged when its language matches the UI language", async () => {
    const board = makeBoard();
    const { create } = stubTranslator();

    const { result } = await setup(board, "en");

    expect(result.current.translation.translatedBoard).toBe(board);
    expect(create).not.toHaveBeenCalled();
  });

  test("applies cached translations synchronously on first paint", async () => {
    const board = makeBoard({
      strings: { "es-ES": { Food: "Comida", eat: "comer", drink: "beber" } },
    });
    const { create } = stubTranslator();

    const { result } = await setup(board, "es");

    const { translatedBoard } = result.current.translation;
    expect(translatedBoard.name).toBe("Comida");
    expect(translatedBoard.buttons[0].label).toBe("comer");
    expect(translatedBoard.buttons[0].vocalization).toBe("comer");
    expect(translatedBoard.buttons[1].label).toBe("beber");
    expect(create).not.toHaveBeenCalled();
  });

  test("translates via the Translator API on a cache miss and applies the result", async () => {
    const board = makeBoard();
    const { create, translate } = stubTranslator((input) => `[es] ${input}`);

    const { result } = await setup(board, "es");

    await vi.waitFor(() => {
      expect(result.current.translation.translatedBoard.name).toBe("[es] Food");
    });

    const { translatedBoard } = result.current.translation;
    expect(translatedBoard.buttons[0].label).toBe("[es] eat");
    expect(translatedBoard.buttons[0].vocalization).toBe("[es] eat");
    expect(translatedBoard.buttons[1].label).toBe("[es] drink");

    expect(create.mock.calls.at(0)?.at(0)).toMatchObject({
      sourceLanguage: "en",
      targetLanguage: "es",
    });

    const inputs = translate.mock.calls.map((call) => call.at(0));
    expect(inputs).toHaveLength(3);
    expect(inputs).toContain("Food");
    expect(inputs).toContain("eat");
    expect(inputs).toContain("drink");
  });

  test("keeps the source board when the Translator API is unavailable", async () => {
    const board = makeBoard();
    stubBuiltInAIUnsupported("Translator");

    const { result } = await setup(board, "es");

    await vi.waitFor(() => {
      expect(result.current.translation.translatedBoard).toBe(board);
    });
  });

  test("keeps the source board when translation throws", async () => {
    const board = makeBoard();
    const { create } = stubTranslator(() =>
      Promise.reject(new Error("model failure")),
    );

    const { result } = await setup(board, "es");

    await vi.waitFor(() => {
      expect(create).toHaveBeenCalled();
    });
    expect(result.current.translation.translatedBoard).toBe(board);
  });

  test("re-translates when the UI language changes", async () => {
    const board = makeBoard();
    const { create, translate } = stubTranslator((input) => `de:${input}`);

    const { result } = await setup(board);

    expect(result.current.translation.translatedBoard).toBe(board);
    expect(translate).not.toHaveBeenCalled();

    result.current.setLanguage("de");

    await vi.waitFor(() => {
      expect(result.current.translation.translatedBoard.name).toBe("de:Food");
    });
    expect(create.mock.calls.at(0)?.at(0)).toMatchObject({
      sourceLanguage: "en",
      targetLanguage: "de",
    });
  });

  test("ignores a stale translation when the UI language changes mid-flight", async () => {
    const board = makeBoard();
    const calls: { input: string; resolve: (value: string) => void }[] = [];
    stubTranslator(
      (input) =>
        new Promise<string>((resolve) => {
          calls.push({ input, resolve });
        }),
    );

    const { result } = await setup(board, "es");

    await vi.waitFor(() => {
      expect(calls).toHaveLength(3);
    });

    result.current.setLanguage("de");
    await vi.waitFor(() => {
      expect(calls).toHaveLength(6);
    });

    for (const { input, resolve } of calls.slice(3)) {
      resolve(`de:${input}`);
    }

    for (const { input, resolve } of calls.slice(0, 3)) {
      resolve(`es:${input}`);
    }

    await vi.waitFor(() => {
      expect(result.current.translation.translatedBoard.name).toBe("de:Food");
    });
  });
});
