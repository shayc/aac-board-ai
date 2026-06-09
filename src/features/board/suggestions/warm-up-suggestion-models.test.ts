import {
  setStoredLanguage,
  DEFAULT_LANGUAGE,
} from "@shared/language/language-store";
import {
  stubBuiltInAIUnsupported,
  stubProofreader,
  stubRewriter,
} from "@shared/testing/built-in-ai";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { warmUpSuggestionModels } from "./warm-up-suggestion-models";

describe("warmUpSuggestionModels", () => {
  beforeEach(() => {
    setStoredLanguage(DEFAULT_LANGUAGE);
  });

  test("provisions both engines with the stored language and releases them", async () => {
    const proofreaderDestroy = vi.fn();
    const rewriterDestroy = vi.fn();
    const proofreader = stubProofreader();
    const rewriter = stubRewriter();
    proofreader.create.mockResolvedValue({ destroy: proofreaderDestroy });
    rewriter.create.mockResolvedValue({ destroy: rewriterDestroy });
    setStoredLanguage("he");

    warmUpSuggestionModels();

    await vi.waitFor(() => {
      expect(proofreader.create.mock.calls.at(0)?.at(0)).toMatchObject({
        expectedInputLanguages: ["he"],
      });
      expect(rewriter.create.mock.calls.at(0)?.at(0)).toMatchObject({
        expectedInputLanguages: ["he"],
        expectedContextLanguages: ["he"],
        outputLanguage: "he",
      });
    });

    await vi.waitFor(() => {
      expect(proofreaderDestroy).toHaveBeenCalledOnce();
      expect(rewriterDestroy).toHaveBeenCalledOnce();
    });
  });

  test("does nothing on a browser without the APIs", () => {
    stubBuiltInAIUnsupported("Proofreader", "Rewriter");

    expect(() => warmUpSuggestionModels()).not.toThrow();
  });

  test("swallows provisioning failures", async () => {
    const proofreader = stubProofreader();
    const rewriter = stubRewriter();
    proofreader.create.mockRejectedValue(new Error("user activation required"));
    rewriter.create.mockRejectedValue(new Error("user activation required"));

    warmUpSuggestionModels();

    await vi.waitFor(() => {
      expect(proofreader.create).toHaveBeenCalledOnce();
      expect(rewriter.create).toHaveBeenCalledOnce();
    });
  });
});
