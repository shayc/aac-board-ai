import { useState } from "react";
import type { BaseHookReturn } from "../internal/types.ts";
import { useLifecycle } from "../internal/useLifecycle.ts";

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
  const { status, progress, error, prepare, inputQuota, acquire } =
    useLifecycle<LanguageDetectorOptions, LanguageDetector>(
      "LanguageDetector",
      options,
    );

  const [actions] = useState(() => ({
    async detect(input: string, opts?: DetectCallOptions) {
      const { instance, signal } = await acquire(opts?.signal);
      return instance.detect(input, { signal });
    },
    async measureInput(input: string, opts?: DetectCallOptions) {
      const { instance, signal } = await acquire(opts?.signal);
      return instance.measureInputUsage(input, { signal });
    },
  }));

  return { status, progress, error, prepare, inputQuota, ...actions };
}
