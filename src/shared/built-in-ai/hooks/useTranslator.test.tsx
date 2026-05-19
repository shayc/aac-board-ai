import { afterEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { makeAIFake } from "../internal/test-fakes/ai-namespace-fake.ts";
import { buildTranslatorInstance } from "../internal/test-fakes/instance-fakes.ts";
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

    // The fake echoes input into its output so input-forwarding is
    // observable from the resolved value alone.
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
    // Arrow wrappers keep the hook out of runtime (no React context here);
    // tsc still type-checks the call signatures and fires @ts-expect-error.
    // @ts-expect-error - options argument is required
    void (() => useTranslator());
    // @ts-expect-error - options argument is not optional
    void (() => useTranslator(undefined));
  });
});
