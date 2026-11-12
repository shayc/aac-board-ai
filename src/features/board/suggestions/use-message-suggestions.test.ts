import {
  DEFAULT_LANGUAGE,
  setStoredLanguage,
} from "@shared/language/language-store";
import {
  makeProofreadResult,
  stubProofreader,
  stubRewriter,
} from "@shared/testing/stub-built-in-ai";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { setSuggestionCustomInstructions } from "./suggestion-preferences-store";
import { useMessageSuggestions } from "./use-message-suggestions";

const ENGINE_STUBS = {
  Proofreader: stubProofreader,
  Rewriter: stubRewriter,
};

function renderMessageSuggestions(text: string) {
  return renderHook(() => useMessageSuggestions(text));
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

async function clickToRun(action: () => void): Promise<void> {
  const trigger = document.createElement("button");
  trigger.textContent = "Run with user activation";
  trigger.addEventListener("click", action);
  document.body.append(trigger);

  try {
    await userEvent.click(trigger);
  } finally {
    trigger.remove();
  }
}

describe("useMessageSuggestions", () => {
  beforeEach(() => {
    setSuggestionCustomInstructions("");
    setStoredLanguage(DEFAULT_LANGUAGE);
  });

  test("reports unsupported and stays empty when no Built-in AI is available", async () => {
    const { result } = await renderMessageSuggestions("want eat");

    await vi.waitFor(() => {
      expect(result.current.isSupported).toBe(false);
    });
    expect(result.current.phrases).toEqual([]);
  });

  test("stays supported when only the proofreader is available", async () => {
    stubProofreader();

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

  test("still suggests the rewrite when the proofread fails", async () => {
    stubProofreader(() => Promise.reject(new Error("input too long")));
    stubRewriter(() => "I would like to eat.");

    const { result } = await renderMessageSuggestions("want eat");

    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual(["I would like to eat."]);
      expect(result.current.status).toEqual({ kind: "idle" });
    });
  });

  test("reports failed when all suggestion engines fail", async () => {
    stubProofreader(() => Promise.reject(new Error("proofread down")));
    stubRewriter(() => Promise.reject(new Error("rewrite down")));

    const { result } = await renderMessageSuggestions("want eat");

    await vi.waitFor(() => {
      expect(result.current.status).toEqual({ kind: "failed" });
    });
    expect(result.current.phrases).toEqual([]);
  });

  test("reports idle when the healthy engine has nothing to suggest and the other is broken", async () => {
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
      expect(result.current.status).toEqual({ kind: "idle" });
    });
    expect(result.current.phrases).toEqual([]);
  });

  test("reports idle when a request is rejected with an AbortError", async () => {
    const rejecters: ((error: Error) => void)[] = [];
    stubRewriter(
      () => new Promise<string>((_, reject) => rejecters.push(reject)),
    );

    const { result } = await renderMessageSuggestions("want eat");

    await vi.waitFor(() => {
      expect(rejecters).toHaveLength(2);
      expect(result.current.status).toEqual({ kind: "pending" });
    });
    rejecters.forEach((reject) =>
      reject(new DOMException("Aborted", "AbortError")),
    );

    await vi.waitFor(() => {
      expect(result.current.status).toEqual({ kind: "idle" });
    });
  });

  test.each([
    { engine: "Proofreader", sessions: 1 },
    { engine: "Rewriter", sessions: 2 },
  ] as const)(
    "enabling from a user gesture downloads every $engine model",
    async ({ engine, sessions }) => {
      const { availability, create } = ENGINE_STUBS[engine]();
      availability.mockResolvedValue("downloadable");

      const { result } = await renderMessageSuggestions("want eat");

      await vi.waitFor(() => {
        expect(result.current.status).toEqual({ kind: "not-enabled" });
      });
      expect(create).not.toHaveBeenCalled();

      await clickToRun(() => result.current.enable());

      await vi.waitFor(() => {
        expect(create).toHaveBeenCalledTimes(sessions);
        expect(result.current.status).toEqual({ kind: "idle" });
      });
      for (const [options] of create.mock.calls) {
        expect(options).toHaveProperty("monitor", expect.any(Function));
      }
    },
  );

  test("offers enabling again after an engine fails, and recovers from that gesture", async () => {
    const { create } = stubProofreader(() =>
      makeProofreadResult("I want to eat."),
    );
    create.mockRejectedValueOnce(new Error("model crashed"));

    const { result } = await renderMessageSuggestions("want eat");

    await vi.waitFor(() => {
      expect(create).toHaveBeenCalledOnce();
      expect(result.current.status).toEqual({ kind: "not-enabled" });
    });
    expect(result.current.phrases).toEqual([]);

    await clickToRun(() => result.current.enable());

    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual(["I want to eat."]);
      expect(result.current.status).toEqual({ kind: "idle" });
    });
  });

  test("forgets the previous language's availability while the new probe is in flight", async () => {
    const proofreader = stubProofreader();
    proofreader.availability.mockImplementation((options) =>
      (options?.expectedInputLanguages as string[] | undefined)?.[0] === "en"
        ? Promise.resolve("downloadable")
        : new Promise<Availability>(() => undefined),
    );

    const { result } = await renderMessageSuggestions("want eat");

    await vi.waitFor(() => {
      expect(result.current.status).toEqual({ kind: "not-enabled" });
    });

    setStoredLanguage("he");

    await vi.waitFor(() => {
      expect(result.current.status).toEqual({ kind: "idle" });
    });
  });

  test("passes custom instructions to every fixed-tone rewriter", async () => {
    setSuggestionCustomInstructions("Talk like a pirate");
    const { create } = stubRewriter();

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
    const resolvers: ((rewritten: string) => void)[] = [];
    stubRewriter(
      () => new Promise<string>((resolve) => resolvers.push(resolve)),
    );

    const { result } = await renderMessageSuggestions("hi");

    await vi.waitFor(() => {
      expect(result.current.status).toEqual({ kind: "pending" });
    });

    await vi.waitFor(() => expect(resolvers).toHaveLength(2));
    resolvers[0]?.("direct hi");
    resolvers[1]?.("friendly hi");

    await vi.waitFor(() => {
      expect(result.current.phrases).toEqual(["direct hi", "friendly hi"]);
      expect(result.current.status).toEqual({ kind: "idle" });
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

    const { result, rerender } = await renderHook(
      ({ text }: { text: string } = { text: "old" }) =>
        useMessageSuggestions(text),
      { initialProps: { text: "old" } },
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

    const { result, rerender } = await renderHook(
      ({ text }: { text: string } = { text: "old" }) =>
        useMessageSuggestions(text),
      { initialProps: { text: "old" } },
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
