import {
  makeProofreadResult,
  stubBuiltInAIUnsupported,
  stubProofreader,
  stubRewriter,
} from "@shared/testing/built-in-ai";
import { describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useSuggestions } from "./use-suggestions";

describe("useSuggestions", () => {
  test("reports unsupported and stays empty when no Built-in AI is available", async () => {
    stubBuiltInAIUnsupported("Proofreader", "Rewriter");

    const { result } = await renderHook(() => useSuggestions("want eat"));

    await vi.waitFor(() => {
      expect(result.current.isSupported).toBe(false);
    });
    expect(result.current.phrases).toEqual([]);
  });

  test("reports supported when only one capability is available", async () => {
    stubProofreader();
    stubBuiltInAIUnsupported("Rewriter");

    const { result } = await renderHook(() => useSuggestions("want eat"));

    await vi.waitFor(() => {
      expect(result.current.isSupported).toBe(true);
    });
  });

  test("surfaces both a proofread correction and a rewrite as suggestions", async () => {
    stubProofreader(() => makeProofreadResult("I want to eat."));
    stubRewriter(() => "I would like to eat.");

    const { result } = await renderHook(() => useSuggestions("want eat"));

    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual([
        "I want to eat.",
        "I would like to eat.",
      ]);
    });
  });

  test("dedupes identical proofread and rewrite outputs", async () => {
    stubProofreader(() => makeProofreadResult("Hello."));
    stubRewriter(() => "Hello.");

    const { result } = await renderHook(() => useSuggestions("helo"));

    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual(["Hello."]);
    });
  });

  test("drops a candidate that is identical to the original text", async () => {
    stubProofreader((input) => makeProofreadResult(input));
    stubRewriter(() => "Something different.");

    const { result } = await renderHook(() => useSuggestions("unchanged"));

    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual(["Something different."]);
    });
  });

  test.each([
    ["underscored tokens", "raw_token", "I want food."],
    ["double quotes", 'he said "hi"', "no quotes here"],
  ])("filters out a candidate with %s", async (_label, rejected, accepted) => {
    stubProofreader(() => makeProofreadResult(rejected));
    stubRewriter(() => accepted);

    const { result } = await renderHook(() => useSuggestions("seed"));

    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual([accepted]);
    });
  });

  test("passes the persisted shared context to the rewriter", async () => {
    localStorage.setItem(
      "ai-shared-context",
      JSON.stringify("Talk like a pirate"),
    );
    const { create } = stubRewriter();
    stubBuiltInAIUnsupported("Proofreader");

    await renderHook(() => useSuggestions("ahoy"));

    await vi.waitFor(() => {
      expect(create.mock.calls.at(0)?.at(0)).toMatchObject({
        tone: "as-is",
        sharedContext: "Talk like a pirate",
        length: "shorter",
        format: "plain-text",
      });
    });
  });

  test("re-provisions the rewriter with the new tone when the tone changes", async () => {
    const { create } = stubRewriter((input) => `rewritten ${input}`);
    stubBuiltInAIUnsupported("Proofreader");

    const { result } = await renderHook(() => useSuggestions("hi"));

    await vi.waitFor(() => {
      expect(create.mock.calls.at(0)?.at(0)).toMatchObject({ tone: "as-is" });
    });

    result.current.setTone("more-formal");

    await vi.waitFor(() => {
      const tones = create.mock.calls.map((call) => call.at(0)?.tone);
      expect(tones).toContain("more-formal");
    });
  });

  test("ignores a stale in-flight result when the text changes mid-flight", async () => {
    const resolvers = new Map<string, (result: ProofreadResult) => void>();
    stubProofreader(
      (input) =>
        new Promise<ProofreadResult>((resolve) => {
          resolvers.set(input, resolve);
        }),
    );
    stubBuiltInAIUnsupported("Rewriter");

    const { result, rerender } = await renderHook(
      ({ text }: { text: string } = { text: "old" }) => useSuggestions(text),
      { initialProps: { text: "old" } },
    );

    // First request is in flight once the proofreader has provisioned.
    await vi.waitFor(() => {
      expect(resolvers.has("old")).toBe(true);
    });

    // Changing the text aborts the "old" run and starts a fresh one.
    await rerender({ text: "new" });
    await vi.waitFor(() => {
      expect(resolvers.has("new")).toBe(true);
    });

    // Resolve the current request first, then let the aborted one settle.
    resolvers.get("new")?.(makeProofreadResult("corrected new"));
    resolvers.get("old")?.(makeProofreadResult("corrected old"));

    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual(["corrected new"]);
    });
  });
});
