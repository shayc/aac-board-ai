import { afterEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { makeAIFake } from "../../internal/__tests__/mocks/ai-namespace-fake.ts";
import { buildSummarizerInstance } from "../../internal/__tests__/mocks/instance-fakes.ts";
import { useSummarizer } from "../useSummarizer.ts";

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

    // The fake echoes context into its output so both forwardings are
    // observable from the resolved value alone.
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
});
