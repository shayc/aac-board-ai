import { afterEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { makeAIFake } from "../internal/test-fakes/ai-namespace-fake.ts";
import { buildRewriterInstance } from "../internal/test-fakes/instance-fakes.ts";
import { useRewriter } from "./useRewriter.ts";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useRewriter", () => {
  test("reaches ready and exposes inputQuota from the instance", async () => {
    const { Fake } = makeAIFake({ buildInstance: buildRewriterInstance });
    vi.stubGlobal("Rewriter", Fake);

    const { result } = await renderHook(() =>
      useRewriter({ tone: "more-formal" }),
    );

    await vi.waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.inputQuota).toBe(768);
  });

  test("rewrite() forwards both input and context to the instance", async () => {
    const { Fake } = makeAIFake({ buildInstance: buildRewriterInstance });
    vi.stubGlobal("Rewriter", Fake);

    const { result } = await renderHook(() => useRewriter());
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));

    await expect(
      result.current.rewrite("hello", { context: "softer" }),
    ).resolves.toBe("R(softer):hello");
  });

  test("rewriteStream() yields all chunks from the streaming source", async () => {
    const { Fake } = makeAIFake({ buildInstance: buildRewriterInstance });
    vi.stubGlobal("Rewriter", Fake);

    const { result } = await renderHook(() => useRewriter());
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));

    const out: string[] = [];
    for await (const c of result.current.rewriteStream("hi")) {
      out.push(c);
    }
    expect(out).toEqual(["R:", "alt"]);
  });
});
