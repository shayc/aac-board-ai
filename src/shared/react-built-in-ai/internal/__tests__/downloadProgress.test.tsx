import { afterEach, describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import {
  buildProgressKey,
  clearDownloadProgress,
  setDownloadProgress,
  useDownloadProgress,
} from "../downloadProgress.ts";

function cleanup(...keys: string[]): void {
  for (const k of keys) {
    clearDownloadProgress(k);
  }
}

afterEach(() => {
  cleanup(
    "Translator",
    "Translator:en:fr",
    "Translator:en:de",
    'Translator:{"sourceLanguage":"en","targetLanguage":"fr"}',
  );
});

describe("useDownloadProgress", () => {
  test("reports the highest in-flight progress matching the prefix", async () => {
    const { result } = await renderHook(() =>
      useDownloadProgress("Translator"),
    );
    expect(result.current).toBe(0);

    setDownloadProgress("Translator:en:fr", 0.25);
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current).toBe(0.25);

    setDownloadProgress("Translator:en:de", 0.7);
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current).toBe(0.7);

    clearDownloadProgress("Translator:en:de");
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current).toBe(0.25);
  });

  test("matches an exact-prefix key as well as `prefix:…` keys", async () => {
    const { result } = await renderHook(() =>
      useDownloadProgress("Translator"),
    );

    setDownloadProgress("Translator", 0.5);
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current).toBe(0.5);
  });

  test("ignores unrelated keys", async () => {
    const { result } = await renderHook(() =>
      useDownloadProgress("Translator"),
    );

    setDownloadProgress("Summarizer", 0.9);
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current).toBe(0);

    clearDownloadProgress("Summarizer");
  });
});

describe("buildProgressKey", () => {
  test("returns the bare name when options are empty or undefined", () => {
    expect(buildProgressKey("Summarizer", undefined)).toBe("Summarizer");
    expect(buildProgressKey("Summarizer", {})).toBe("Summarizer");
  });

  test("appends a JSON-stringified options suffix when present", () => {
    expect(
      buildProgressKey("Translator", {
        sourceLanguage: "en",
        targetLanguage: "fr",
      }),
    ).toBe('Translator:{"sourceLanguage":"en","targetLanguage":"fr"}');
  });
});
