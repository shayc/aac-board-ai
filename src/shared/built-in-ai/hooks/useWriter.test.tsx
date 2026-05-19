import { afterEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { makeAIFake } from "../internal/test-fakes/ai-namespace-fake.ts";
import { buildWriterInstance } from "../internal/test-fakes/instance-fakes.ts";
import { useWriter } from "./useWriter.ts";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useWriter", () => {
  test("reaches ready and exposes inputQuota from the instance", async () => {
    const { Fake } = makeAIFake({ buildInstance: buildWriterInstance });
    vi.stubGlobal("Writer", Fake);

    const { result } = await renderHook(() => useWriter({ tone: "neutral" }));

    await vi.waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.inputQuota).toBe(512);
  });

  test("write() forwards both input and context to the instance", async () => {
    const { Fake } = makeAIFake({ buildInstance: buildWriterInstance });
    vi.stubGlobal("Writer", Fake);

    const { result } = await renderHook(() => useWriter());
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));

    // The fake echoes context into its output so both forwardings are
    // observable from the resolved value alone.
    await expect(
      result.current.write("draft", { context: "tone: formal" }),
    ).resolves.toBe("W(tone: formal):draft");
  });

  test("writeStream() yields all chunks from the streaming source", async () => {
    const { Fake } = makeAIFake({ buildInstance: buildWriterInstance });
    vi.stubGlobal("Writer", Fake);

    const { result } = await renderHook(() => useWriter());
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));

    const out: string[] = [];
    for await (const c of result.current.writeStream("draft")) {
      out.push(c);
    }
    expect(out).toEqual(["W:", "out"]);
  });
});
