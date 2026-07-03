import { setAISharedContext } from "@shared/built-in-ai/shared-context-store";
import { setAITone } from "@shared/built-in-ai/tone-store";
import { LanguageProvider } from "@shared/language/language-provider";
import {
  DEFAULT_LANGUAGE,
  setStoredLanguage,
} from "@shared/language/language-store";
import {
  makeProofreadResult,
  stubBuiltInAIUnsupported,
  stubProofreader,
  stubRewriter,
} from "@shared/testing/built-in-ai";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useSuggestions } from "./use-suggestions";

function renderSuggestions(text: string) {
  return renderHook(() => useSuggestions(text), { wrapper: LanguageProvider });
}

describe("useSuggestions", () => {
  beforeEach(() => {
    setAISharedContext("");
    setAITone("as-is");
    setStoredLanguage(DEFAULT_LANGUAGE);
  });

  test("reports unsupported and stays empty when no Built-in AI is available", async () => {
    stubBuiltInAIUnsupported("Proofreader", "Rewriter");

    const { result } = await renderSuggestions("want eat");

    await vi.waitFor(() => {
      expect(result.current.isSupported).toBe(false);
    });
    expect(result.current.phrases).toEqual([]);
  });

  test("stays supported when only the proofreader is available", async () => {
    stubProofreader();
    stubBuiltInAIUnsupported("Rewriter");

    const { result } = await renderSuggestions("want eat");

    await vi.waitFor(() => {
      expect(result.current.isSupported).toBe(true);
    });
  });

  test("surfaces both a proofread correction and a rewrite as suggestions", async () => {
    stubProofreader(() => makeProofreadResult("I want to eat."));
    stubRewriter(() => "I would like to eat.");

    const { result } = await renderSuggestions("want eat");

    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual([
        "I want to eat.",
        "I would like to eat.",
      ]);
    });
  });

  test("dedupes proofread and rewrite outputs that differ only in case", async () => {
    stubProofreader(() => makeProofreadResult("My movies"));
    stubRewriter(() => "my movies");

    const { result } = await renderSuggestions("movies");

    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual(["My movies"]);
    });
  });

  test("drops a candidate that is identical to the original text", async () => {
    stubProofreader((input) => makeProofreadResult(input));
    stubRewriter(() => "Something different.");

    const { result } = await renderSuggestions("unchanged");

    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual(["Something different."]);
    });
  });

  test("still suggests the rewrite when the proofread fails", async () => {
    stubProofreader(() => Promise.reject(new Error("input too long")));
    stubRewriter(() => "I would like to eat.");

    const { result } = await renderSuggestions("want eat");

    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual(["I would like to eat."]);
      expect(result.current.status).toBeNull();
    });
  });

  test("reports unavailable when both engines fail", async () => {
    stubProofreader(() => Promise.reject(new Error("proofread down")));
    stubRewriter(() => Promise.reject(new Error("rewrite down")));

    const { result } = await renderSuggestions("want eat");

    await vi.waitFor(() => {
      expect(result.current.status).toEqual({ kind: "unavailable" });
    });
    expect(result.current.phrases).toEqual([]);
  });

  test("stays silent when the healthy engine has nothing to suggest and the other is broken", async () => {
    const rejecters: ((error: Error) => void)[] = [];
    stubProofreader((input) => makeProofreadResult(input));
    stubRewriter(
      () => new Promise<string>((_, reject) => rejecters.push(reject)),
    );

    const { result } = await renderSuggestions("unchanged");

    await vi.waitFor(() => {
      expect(rejecters).toHaveLength(1);
      expect(result.current.status).toEqual({ kind: "pending" });
    });
    rejecters[0](new Error("rewrite down"));

    await vi.waitFor(() => {
      expect(result.current.status).toBeNull();
    });
    expect(result.current.phrases).toEqual([]);
  });

  test("stays quiet when a rejection is an abort by name", async () => {
    const rejecters: ((error: Error) => void)[] = [];
    stubRewriter(
      () => new Promise<string>((_, reject) => rejecters.push(reject)),
    );
    stubBuiltInAIUnsupported("Proofreader");

    const { result } = await renderSuggestions("want eat");

    await vi.waitFor(() => {
      expect(rejecters).toHaveLength(1);
      expect(result.current.status).toEqual({ kind: "pending" });
    });
    rejecters[0](new DOMException("Aborted", "AbortError"));

    await vi.waitFor(() => {
      expect(result.current.status).toBeNull();
    });
  });

  test("asks for activation when the model needs a user-gesture download", async () => {
    const proofreader = stubProofreader();
    proofreader.availability.mockResolvedValue("downloadable");
    stubBuiltInAIUnsupported("Rewriter");

    const { result } = await renderSuggestions("want eat");

    await vi.waitFor(() => {
      expect(result.current.status).toEqual({ kind: "needs-activation" });
    });
  });

  test("forgets the previous language's availability while the new probe is in flight", async () => {
    const proofreader = stubProofreader();
    proofreader.availability.mockImplementation((options) =>
      (options?.expectedInputLanguages as string[] | undefined)?.[0] === "en"
        ? Promise.resolve("downloadable")
        : new Promise<Availability>(() => undefined),
    );
    stubBuiltInAIUnsupported("Rewriter");

    const { result } = await renderSuggestions("want eat");

    await vi.waitFor(() => {
      expect(result.current.status).toEqual({ kind: "needs-activation" });
    });

    setStoredLanguage("he");

    await vi.waitFor(() => {
      expect(result.current.status).toBeNull();
    });
  });

  test("passes the persisted shared context to the rewriter", async () => {
    setAISharedContext("Talk like a pirate");
    const { create } = stubRewriter();
    stubBuiltInAIUnsupported("Proofreader");

    await renderSuggestions("ahoy");

    await vi.waitFor(() => {
      expect(create.mock.calls.at(0)?.at(0)).toMatchObject({
        tone: "as-is",
        sharedContext: "Talk like a pirate",
        length: "shorter",
        format: "plain-text",
      });
    });
  });

  test("provisions both engines with the message language", async () => {
    const { create: createRewriter } = stubRewriter();
    const { create: createProofreader } = stubProofreader();

    await renderSuggestions("hello");

    await vi.waitFor(() => {
      expect(createRewriter.mock.calls.at(0)?.at(0)).toMatchObject({
        expectedInputLanguages: ["en"],
        expectedContextLanguages: ["en"],
        outputLanguage: "en",
      });
      expect(createProofreader.mock.calls.at(0)?.at(0)).toMatchObject({
        expectedInputLanguages: ["en"],
      });
    });
  });

  test("uses the selected language rather than English", async () => {
    setStoredLanguage("he");
    const { create } = stubRewriter();
    stubBuiltInAIUnsupported("Proofreader");

    await renderSuggestions("שלום");

    await vi.waitFor(() => {
      expect(create.mock.calls.at(0)?.at(0)).toMatchObject({
        expectedInputLanguages: ["he"],
        expectedContextLanguages: ["he"],
        outputLanguage: "he",
      });
    });
  });

  test("re-provisions the rewriter with the new tone when the tone changes", async () => {
    const { create } = stubRewriter((input) => `rewritten ${input}`);
    stubBuiltInAIUnsupported("Proofreader");

    await renderSuggestions("hi");

    await vi.waitFor(() => {
      expect(create.mock.calls.at(0)?.at(0)).toMatchObject({ tone: "as-is" });
    });

    setAITone("more-formal");

    await vi.waitFor(() => {
      const tones = create.mock.calls.map((call) => call.at(0)?.tone);
      expect(tones).toContain("more-formal");
    });
  });

  test("changing tone re-invokes only the rewriter, leaving the proofreader untouched", async () => {
    const { proofread, create: createProofreader } = stubProofreader();
    const { create: createRewriter } = stubRewriter();

    await renderSuggestions("want eat");

    await vi.waitFor(() => {
      expect(proofread).toHaveBeenCalledTimes(1);
    });
    expect(createProofreader).toHaveBeenCalledTimes(1);

    setAITone("more-formal");

    await vi.waitFor(() => {
      const tones = createRewriter.mock.calls.map((call) => call.at(0)?.tone);
      expect(tones).toContain("more-formal");
    });

    expect(proofread).toHaveBeenCalledTimes(1);
    expect(createProofreader).toHaveBeenCalledTimes(1);
  });

  test("drops the stale rewrite when the tone changes, until the new tone resolves", async () => {
    const pending: ((rewritten: string) => void)[] = [];
    stubRewriter(() => new Promise<string>((resolve) => pending.push(resolve)));
    stubBuiltInAIUnsupported("Proofreader");

    const { result } = await renderSuggestions("hi");

    await vi.waitFor(() => expect(pending).toHaveLength(1));
    pending[0]("casual hi");
    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual(["casual hi"]);
    });

    setAITone("more-formal");
    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual([]);
    });

    await vi.waitFor(() => expect(pending).toHaveLength(2));
    pending[1]("formal hi");
    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual(["formal hi"]);
    });
  });

  test("reports a pending status while a suggestion is in flight and clears it once resolved", async () => {
    const pending: ((rewritten: string) => void)[] = [];
    stubRewriter(() => new Promise<string>((resolve) => pending.push(resolve)));
    stubBuiltInAIUnsupported("Proofreader");

    const { result } = await renderSuggestions("hi");

    await vi.waitFor(() => {
      expect(result.current.status).toEqual({ kind: "pending" });
    });

    await vi.waitFor(() => expect(pending).toHaveLength(1));
    pending[0]("casual hi");

    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual(["casual hi"]);
      expect(result.current.status).toBeNull();
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
      { initialProps: { text: "old" }, wrapper: LanguageProvider },
    );

    await vi.waitFor(() => {
      expect(resolvers.has("old")).toBe(true);
    });

    await rerender({ text: "new" });
    await vi.waitFor(() => {
      expect(resolvers.has("new")).toBe(true);
    });

    resolvers.get("new")?.(makeProofreadResult("corrected new"));
    resolvers.get("old")?.(makeProofreadResult("corrected old"));

    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual(["corrected new"]);
    });
  });

  test("clears stale suggestions immediately when the text changes, before new ones resolve", async () => {
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
      { initialProps: { text: "old" }, wrapper: LanguageProvider },
    );

    await vi.waitFor(() => {
      expect(resolvers.has("old")).toBe(true);
    });
    resolvers.get("old")?.(makeProofreadResult("corrected old"));
    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual(["corrected old"]);
    });

    await rerender({ text: "new" });
    expect(result.current.phrases).toEqual([]);
  });
});
