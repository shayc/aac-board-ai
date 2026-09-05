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
} from "@shared/testing/stub-built-in-ai";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { setSuggestionCustomInstructions } from "./suggestion-config-store";
import { useMessageSuggestions } from "./use-message-suggestions";

function renderMessageSuggestions(text: string) {
  return renderHook(() => useMessageSuggestions(text), {
    wrapper: LanguageProvider,
  });
}

function stubRewritesByTone(
  rewrites: Pick<Record<RewriterTone, string>, "as-is" | "more-casual">,
) {
  const rewriter = stubRewriter();

  rewriter.create.mockImplementation((options) => {
    const tone = options?.tone as keyof typeof rewrites;

    return Promise.resolve({
      destroy: () => undefined,
      rewrite: () => Promise.resolve(rewrites[tone]),
    });
  });

  return rewriter;
}

describe("useMessageSuggestions", () => {
  beforeEach(() => {
    setSuggestionCustomInstructions("");
    setStoredLanguage(DEFAULT_LANGUAGE);
  });

  test("reports unsupported and stays empty when no Built-in AI is available", async () => {
    stubBuiltInAIUnsupported("Proofreader", "Rewriter");

    const { result } = await renderMessageSuggestions("want eat");

    await vi.waitFor(() => {
      expect(result.current.isSupported).toBe(false);
    });
    expect(result.current.phrases).toEqual([]);
  });

  test("stays supported when only the proofreader is available", async () => {
    stubProofreader();
    stubBuiltInAIUnsupported("Rewriter");

    const { result } = await renderMessageSuggestions("want eat");

    await vi.waitFor(() => {
      expect(result.current.isSupported).toBe(true);
    });
  });

  test("surfaces a proofread correction and deduped rewrites as suggestions", async () => {
    stubProofreader(() => makeProofreadResult("I want to eat."));
    stubRewriter(() => "I would like to eat.");

    const { result } = await renderMessageSuggestions("want eat");

    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual([
        "I want to eat.",
        "I would like to eat.",
      ]);
    });
  });

  test("orders suggestions as proofread, direct, then friendly", async () => {
    stubProofreader(() => makeProofreadResult("Proofread message."));
    stubRewritesByTone({
      "as-is": "Direct message.",
      "more-casual": "Friendly message.",
    });

    const { result } = await renderMessageSuggestions("message");

    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual([
        "Proofread message.",
        "Direct message.",
        "Friendly message.",
      ]);
    });
  });

  test("dedupes proofread and rewrite outputs that differ only in case", async () => {
    stubProofreader(() => makeProofreadResult("My movies"));
    stubRewriter(() => "my movies");

    const { result } = await renderMessageSuggestions("movies");

    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual(["My movies"]);
    });
  });

  test("drops a candidate that is identical to the original text", async () => {
    stubProofreader((input) => makeProofreadResult(input));
    stubRewriter(() => "Something different.");

    const { result } = await renderMessageSuggestions("unchanged");

    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual(["Something different."]);
    });
  });

  test("still suggests the rewrite when the proofread fails", async () => {
    stubProofreader(() => Promise.reject(new Error("input too long")));
    stubRewriter(() => "I would like to eat.");

    const { result } = await renderMessageSuggestions("want eat");

    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual(["I would like to eat."]);
      expect(result.current.status).toBeNull();
    });
  });

  test("reports unavailable when all suggestion engines fail", async () => {
    stubProofreader(() => Promise.reject(new Error("proofread down")));
    stubRewriter(() => Promise.reject(new Error("rewrite down")));

    const { result } = await renderMessageSuggestions("want eat");

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

    const { result } = await renderMessageSuggestions("unchanged");

    await vi.waitFor(() => {
      expect(rejecters).toHaveLength(2);
      expect(result.current.status).toEqual({ kind: "pending" });
    });
    rejecters.forEach((reject) => reject(new Error("rewrite down")));

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

    const { result } = await renderMessageSuggestions("want eat");

    await vi.waitFor(() => {
      expect(rejecters).toHaveLength(2);
      expect(result.current.status).toEqual({ kind: "pending" });
    });
    rejecters.forEach((reject) =>
      reject(new DOMException("Aborted", "AbortError")),
    );

    await vi.waitFor(() => {
      expect(result.current.status).toBeNull();
    });
  });

  test("enable prepares the proofreader", async () => {
    const proofreader = stubProofreader();
    proofreader.availability.mockResolvedValue("downloadable");
    stubBuiltInAIUnsupported("Rewriter");

    const { result } = await renderMessageSuggestions("want eat");

    await vi.waitFor(() => {
      expect(result.current.status).toEqual({ kind: "needs-setup" });
      expect(proofreader.availability).toHaveBeenCalledOnce();
    });

    result.current.enable();

    await vi.waitFor(() => {
      expect(proofreader.availability).toHaveBeenCalledTimes(2);
    });
  });

  test("enable prepares every fixed-tone rewriter", async () => {
    const rewriter = stubRewriter();
    rewriter.availability.mockResolvedValue("downloadable");
    stubBuiltInAIUnsupported("Proofreader");

    const { result } = await renderMessageSuggestions("want eat");

    await vi.waitFor(() => {
      expect(result.current.status).toEqual({ kind: "needs-setup" });
      expect(rewriter.availability).toHaveBeenCalledTimes(2);
    });

    result.current.enable();

    await vi.waitFor(() => {
      expect(rewriter.availability).toHaveBeenCalledTimes(4);
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

    const { result } = await renderMessageSuggestions("want eat");

    await vi.waitFor(() => {
      expect(result.current.status).toEqual({ kind: "needs-setup" });
    });

    setStoredLanguage("he");

    await vi.waitFor(() => {
      expect(result.current.status).toBeNull();
    });
  });

  test("passes custom instructions to every fixed-tone rewriter", async () => {
    setSuggestionCustomInstructions("Talk like a pirate");
    const { create } = stubRewriter();
    stubBuiltInAIUnsupported("Proofreader");

    await renderMessageSuggestions("ahoy");

    await vi.waitFor(() => {
      expect(create).toHaveBeenCalledTimes(2);
    });

    expect(create.mock.calls.map(([options]) => options)).toEqual([
      expect.objectContaining({
        tone: "as-is",
        sharedContext: "Talk like a pirate",
        length: "shorter",
        format: "plain-text",
      }),
      expect.objectContaining({
        tone: "more-casual",
        sharedContext: "Talk like a pirate",
        length: "shorter",
        format: "plain-text",
      }),
    ]);
  });

  test("provisions both engines with the message language", async () => {
    const { create: createRewriter } = stubRewriter();
    const { create: createProofreader } = stubProofreader();

    await renderMessageSuggestions("hello");

    await vi.waitFor(() => {
      expect(createRewriter).toHaveBeenCalledTimes(2);
      expect(createProofreader.mock.calls.at(0)?.at(0)).toMatchObject({
        expectedInputLanguages: ["en"],
      });
    });

    for (const [options] of createRewriter.mock.calls) {
      expect(options).toMatchObject({
        expectedInputLanguages: ["en"],
        expectedContextLanguages: ["en"],
        outputLanguage: "en",
      });
    }
  });

  test("uses the selected language rather than English", async () => {
    setStoredLanguage("he");
    const { create } = stubRewriter();
    stubBuiltInAIUnsupported("Proofreader");

    await renderMessageSuggestions("שלום");

    await vi.waitFor(() => {
      expect(create).toHaveBeenCalledTimes(2);
    });

    for (const [options] of create.mock.calls) {
      expect(options).toMatchObject({
        expectedInputLanguages: ["he"],
        expectedContextLanguages: ["he"],
        outputLanguage: "he",
      });
    }
  });

  test("reports a pending status while a suggestion is in flight and clears it once resolved", async () => {
    const pending: ((rewritten: string) => void)[] = [];
    stubRewriter(() => new Promise<string>((resolve) => pending.push(resolve)));
    stubBuiltInAIUnsupported("Proofreader");

    const { result } = await renderMessageSuggestions("hi");

    await vi.waitFor(() => {
      expect(result.current.status).toEqual({ kind: "pending" });
    });

    await vi.waitFor(() => expect(pending).toHaveLength(2));
    pending[0]("direct hi");
    pending[1]("friendly hi");

    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual(["direct hi", "friendly hi"]);
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
      ({ text }: { text: string } = { text: "old" }) =>
        useMessageSuggestions(text),
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
      ({ text }: { text: string } = { text: "old" }) =>
        useMessageSuggestions(text),
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
