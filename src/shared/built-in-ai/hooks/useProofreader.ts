import { useState } from "react";
import { useLifecycle } from "../internal/useLifecycle.ts";
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
  const { acquire, ...lifecycle } = useLifecycle<
    ProofreaderOptions,
    Proofreader
  >("Proofreader", options);

  const [actions] = useState(() => ({
    async proofread(
      input: string,
      opts?: ProofreadCallOptions,
    ): Promise<ProofreadResult> {
      const { instance, signal } = await acquire(opts?.signal);
      return instance.proofread(input, { signal });
    },
  }));

  return { ...lifecycle, ...actions };
}
