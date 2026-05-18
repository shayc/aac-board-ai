import { afterEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { makeAIFake } from "../../internal/__tests__/mocks/ai-namespace-fake.ts";
import { buildLanguageDetectorInstance } from "../../internal/__tests__/mocks/instance-fakes.ts";
import { useLanguageDetector } from "../useLanguageDetector.ts";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useLanguageDetector", () => {
  test("reaches ready and exposes inputQuota from the instance", async () => {
    const { Fake } = makeAIFake({
      buildInstance: buildLanguageDetectorInstance,
    });
    vi.stubGlobal("LanguageDetector", Fake);

    const { result } = await renderHook(() => useLanguageDetector());

    await vi.waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.inputQuota).toBe(256);
  });

  test("detect() returns the LanguageDetectionResult array from the instance", async () => {
    const { Fake, instances } = makeAIFake({
      buildInstance: buildLanguageDetectorInstance,
    });
    vi.stubGlobal("LanguageDetector", Fake);

    const { result } = await renderHook(() => useLanguageDetector());
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));

    await expect(result.current.detect("Bonjour le monde")).resolves.toEqual([
      { detectedLanguage: "en", confidence: 0.9 },
      { detectedLanguage: "fr", confidence: 0.1 },
    ]);
    expect(instances[0].detect).toHaveBeenCalledTimes(1);
  });
});
