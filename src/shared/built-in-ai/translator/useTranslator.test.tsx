import { afterEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { makeAIFake } from "../internal/testing/ai-namespace-fake.ts";
import { buildTranslatorInstance } from "../internal/testing/instance-fakes.ts";
import { useTranslator } from "./useTranslator.ts";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useTranslator", () => {
  test("reaches ready and exposes inputQuota from the instance", async () => {
    const { Fake } = makeAIFake({ buildInstance: buildTranslatorInstance });
    vi.stubGlobal("Translator", Fake);

    const { result } = await renderHook(() =>
      useTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    );

    await vi.waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.inputQuota).toBe(1024);
  });

  test("translate() forwards input to the instance", async () => {
    const { Fake } = makeAIFake({ buildInstance: buildTranslatorInstance });
    vi.stubGlobal("Translator", Fake);

    const { result } = await renderHook(() =>
      useTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    );
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));

    // Fake echoes input into the output — resolved value proves the forwarding.
    await expect(result.current.translate("hi")).resolves.toBe("T:hi");
  });

  test("translateStream() yields all chunks from the streaming source", async () => {
    const { Fake } = makeAIFake({ buildInstance: buildTranslatorInstance });
    vi.stubGlobal("Translator", Fake);

    const { result } = await renderHook(() =>
      useTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    );
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));

    const chunks: string[] = [];
    for await (const c of result.current.translateStream("anything")) {
      chunks.push(c);
    }
    expect(chunks).toEqual(["T:", "hello"]);
  });

  test("useTranslator requires a TranslatorOptions argument (compile-time)", () => {
    // Arrows are never invoked — runtime skipped; tsc still type-checks the call signatures.
    // @ts-expect-error - options argument is required
    void (() => useTranslator());
    // @ts-expect-error - options argument is not optional
    void (() => useTranslator(undefined));
  });
});
