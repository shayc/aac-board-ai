import { afterEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { makeAIFake } from "../internal/test-fakes/ai-namespace-fake.ts";
import { buildSummarizerInstance } from "../internal/test-fakes/instance-fakes.ts";
import { useSummarizer } from "./useSummarizer.ts";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useSummarizer", () => {
  test("reaches ready and exposes inputQuota from the instance", async () => {
    const { Fake } = makeAIFake({ buildInstance: buildSummarizerInstance });
    vi.stubGlobal("Summarizer", Fake);

    const { result } = await renderHook(() => useSummarizer({ type: "tldr" }));

    await vi.waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.inputQuota).toBe(2048);
  });

  test("summarize() forwards both input and context to the instance", async () => {
    const { Fake } = makeAIFake({ buildInstance: buildSummarizerInstance });
    vi.stubGlobal("Summarizer", Fake);

    const { result } = await renderHook(() => useSummarizer());
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));

    // Fake echoes context into the output — resolved value proves both forwardings.
    await expect(
      result.current.summarize("doc", { context: "extra" }),
    ).resolves.toBe("S(extra):doc");
  });

  test("summarizeStream() yields all chunks from the streaming source", async () => {
    const { Fake } = makeAIFake({ buildInstance: buildSummarizerInstance });
    vi.stubGlobal("Summarizer", Fake);

    const { result } = await renderHook(() => useSummarizer());
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));

    const out: string[] = [];
    for await (const c of result.current.summarizeStream("doc")) {
      out.push(c);
    }
    expect(out).toEqual(["S:", "sum"]);
  });

  test("summarize() rejection does not mutate status or error", async () => {
    const { Fake } = makeAIFake({
      buildInstance: () => {
        const inst = buildSummarizerInstance();
        inst.summarize = vi.fn(() => Promise.reject(new Error("boom")));
        return inst;
      },
    });
    vi.stubGlobal("Summarizer", Fake);

    const { result } = await renderHook(() => useSummarizer());
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));

    await expect(result.current.summarize("x")).rejects.toThrow("boom");
    expect(result.current.status).toBe("ready");
    expect(result.current.error).toBeNull();
  });

  test("opts.signal merges into the signal received by instance.summarize", async () => {
    const instance = buildSummarizerInstance();
    const { Fake } = makeAIFake({ buildInstance: () => instance });
    vi.stubGlobal("Summarizer", Fake);

    const { result } = await renderHook(() => useSummarizer());
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));

    const controller = new AbortController();
    await result.current.summarize("doc", { signal: controller.signal });

    const [, callOpts] = instance.summarize.mock.calls[0] as [
      string,
      { signal: AbortSignal },
    ];
    expect(callOpts.signal).toBeInstanceOf(AbortSignal);
    expect(callOpts.signal.aborted).toBe(false);
    const reason = new DOMException("caller aborts", "AbortError");
    controller.abort(reason);
    expect(callOpts.signal.aborted).toBe(true);
    expect(callOpts.signal.reason).toBe(reason);
  });

  test("action method identities are stable across rerenders", async () => {
    const { Fake } = makeAIFake({ buildInstance: buildSummarizerInstance });
    vi.stubGlobal("Summarizer", Fake);

    const { result, rerender } = await renderHook(() => useSummarizer());
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));

    const summarize = result.current.summarize;
    const summarizeStream = result.current.summarizeStream;
    const measureInput = result.current.measureInput;
    const prepare = result.current.prepare;

    await rerender();

    expect(result.current.summarize).toBe(summarize);
    expect(result.current.summarizeStream).toBe(summarizeStream);
    expect(result.current.measureInput).toBe(measureInput);
    expect(result.current.prepare).toBe(prepare);
  });
});
