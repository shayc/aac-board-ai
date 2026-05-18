import { useState } from "react";
import { useLifecycle } from "../internal/lifecycle.ts";
import type { BaseHookReturn } from "../internal/types.ts";

export interface LanguageDetectorOptions {
  expectedInputLanguages?: readonly string[];
}

export interface DetectCallOptions {
  signal?: AbortSignal;
}

export interface LanguageDetectionResult {
  detectedLanguage?: string;
  confidence?: number;
}

export interface LanguageDetectorHookReturn extends BaseHookReturn {
  detect: (
    input: string,
    options?: DetectCallOptions,
  ) => Promise<LanguageDetectionResult[]>;
  measureInput: (input: string, options?: DetectCallOptions) => Promise<number>;
  inputQuota: number;
}

export function useLanguageDetector(
  options?: LanguageDetectorOptions,
): LanguageDetectorHookReturn {
  const lc = useLifecycle<LanguageDetectorOptions, LanguageDetector>(
    "LanguageDetector",
    options,
  );

  const [api] = useState(() => ({
    detect: async (input: string, opts?: DetectCallOptions) => {
      const { instance, signal } = await lc.acquire(opts?.signal);
      return instance.detect(input, { signal });
    },
    measureInput: async (input: string, opts?: DetectCallOptions) => {
      const { instance, signal } = await lc.acquire(opts?.signal);
      return instance.measureInputUsage(input, { signal });
    },
  }));

  return {
    status: lc.status,
    progress: lc.progress,
    error: lc.error,
    inputQuota: lc.inputQuota,
    prepare: lc.prepare,
    detect: api.detect,
    measureInput: api.measureInput,
  };
}
