import { useState } from "react";
import type { BaseHookReturn } from "../internal/types.ts";
import { useLifecycle } from "../internal/useLifecycle.ts";

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
  const { status, progress, error, prepare, acquire } = useLifecycle<
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

  return { status, progress, error, prepare, ...actions };
}
