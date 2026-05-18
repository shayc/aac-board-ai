import { useState } from "react";
import { useLifecycle } from "../internal/lifecycle.ts";
import type { BaseHookReturn } from "../internal/types.ts";

export type CorrectionType =
  | "spelling"
  | "punctuation"
  | "capitalization"
  | "preposition"
  | "missing-words"
  | "grammar";

export interface ProofreadCorrection {
  startIndex: number;
  endIndex: number;
  correction: string;
  types?: CorrectionType[];
  explanation?: string;
}

export interface ProofreadResult {
  correctedInput: string;
  corrections: ProofreadCorrection[];
}

export interface ProofreaderOptions {
  includeCorrectionTypes?: boolean;
  includeCorrectionExplanations?: boolean;
  correctionExplanationLanguage?: string;
  expectedInputLanguages?: readonly string[];
}

export interface ProofreadCallOptions {
  signal?: AbortSignal;
}

export interface ProofreaderHookReturn extends BaseHookReturn {
  proofread: (
    input: string,
    options?: ProofreadCallOptions,
  ) => Promise<ProofreadResult>;
}

export function useProofreader(
  options?: ProofreaderOptions,
): ProofreaderHookReturn {
  const lc = useLifecycle<ProofreaderOptions, Proofreader>(
    "Proofreader",
    options,
  );

  const [api] = useState(() => ({
    proofread: async (
      input: string,
      opts?: ProofreadCallOptions,
    ): Promise<ProofreadResult> => {
      const { instance, signal } = await lc.acquire(opts?.signal);
      return instance.proofread(input, { signal });
    },
  }));

  return {
    status: lc.status,
    progress: lc.progress,
    error: lc.error,
    prepare: lc.prepare,
    proofread: api.proofread,
  };
}
