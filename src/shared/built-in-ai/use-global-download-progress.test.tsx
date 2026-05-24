import { afterEach, describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import {
  clearDownloadProgress,
  setDownloadProgress,
} from "./internal/progress-store";
import { useGlobalDownloadProgress } from "./use-global-download-progress";

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
    "Rewriter",
    "Proofreader",
    "Summarizer",
  );
});

describe("useGlobalDownloadProgress", () => {
  test("reports the highest in-flight progress matching the namespace", async () => {
    const { result } = await renderHook(() =>
      useGlobalDownloadProgress("Translator"),
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

  test("matches an exact namespace key as well as `namespace:…` keys", async () => {
    const { result } = await renderHook(() =>
      useGlobalDownloadProgress("Translator"),
    );

    setDownloadProgress("Translator", 0.5);
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current).toBe(0.5);
  });

  test("ignores keys outside the requested namespace", async () => {
    const { result } = await renderHook(() =>
      useGlobalDownloadProgress("Translator"),
    );

    setDownloadProgress("Rewriter", 0.9);
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current).toBe(0);
  });

  test("with no argument, aggregates across every namespace", async () => {
    const { result } = await renderHook(() => useGlobalDownloadProgress());
    expect(result.current).toBe(0);

    setDownloadProgress("Translator:en:fr", 0.2);
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current).toBe(0.2);

    setDownloadProgress("Rewriter", 0.6);
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current).toBe(0.6);

    setDownloadProgress("Proofreader", 0.8);
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current).toBe(0.8);

    clearDownloadProgress("Proofreader");
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current).toBe(0.6);
  });
});
