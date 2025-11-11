import { useCallback, useRef, useState } from "react";
import {
  AIError,
  isAvailable,
  proofread,
  rewrite,
  translate,
  type LanguageCode,
  type Tone,
} from "@features/ai/aiService";

export type PipelineStep =
  | "idle"
  | "proofreading"
  | "rewriting"
  | "translating"
  | "done"
  | "error";

export interface PipelineOptions {
  tone?: Tone;
  translateTo?: LanguageCode;
  sourceLang?: LanguageCode;
}

export interface PipelineResult {
  original: string;
  proofread?: string;
  rewritten?: string;
  translated?: string;
  final: string;
  skippedSteps: string[];
}

export interface MessagePipelineState {
  step: PipelineStep;
  result: PipelineResult | null;
  error: Error | null;
}

/**
 * Hook for orchestrating AI message transformation pipeline
 *
 * Pipeline: proofread → rewrite (optional) → translate (optional)
 *
 * - Skips unavailable steps gracefully (logs warning)
 * - Treats UNAVAILABLE errors as skip, other errors halt pipeline
 * - Supports cancellation via AbortController
 * - Auto-aborts if new run starts mid-pipeline
 */
export function useMessagePipeline() {
  const [state, setState] = useState<MessagePipelineState>({
    step: "idle",
    result: null,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const onStepChangeRef = useRef<((step: PipelineStep) => void) | null>(null);

  const run = useCallback(
    async (rawText: string, options: PipelineOptions = {}) => {
      // Cancel any in-flight pipeline
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this run
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const skippedSteps: string[] = [];
      const result: PipelineResult = {
        original: rawText,
        final: rawText,
        skippedSteps,
      };

      try {
        let currentText = rawText;

        // Step 1: Proofread
        setState({ step: "proofreading", result: null, error: null });
        onStepChangeRef.current?.("proofreading");

        if (!isAvailable("proofreader")) {
          console.warn("Proofreader unavailable, skipping");
          skippedSteps.push("proofread");
        } else {
          try {
            const proofreadResult = await proofread(
              currentText,
              controller.signal,
            );
            result.proofread = proofreadResult;
            currentText = proofreadResult;
          } catch (error) {
            if (error instanceof AIError && error.code === "UNAVAILABLE") {
              console.warn("Proofreader unavailable, skipping");
              skippedSteps.push("proofread");
            } else {
              throw error;
            }
          }
        }

        // Check for abort after each step
        if (controller.signal.aborted) {
          return;
        }

        // Step 2: Rewrite (optional)
        if (options.tone) {
          setState({ step: "rewriting", result: null, error: null });
          onStepChangeRef.current?.("rewriting");

          if (!isAvailable("rewriter")) {
            console.warn("Rewriter unavailable, skipping");
            skippedSteps.push("rewrite");
          } else {
            try {
              const rewriteResult = await rewrite(
                currentText,
                options.tone,
                controller.signal,
              );
              result.rewritten = rewriteResult;
              currentText = rewriteResult;
            } catch (error) {
              if (error instanceof AIError && error.code === "UNAVAILABLE") {
                console.warn("Rewriter unavailable, skipping");
                skippedSteps.push("rewrite");
              } else {
                throw error;
              }
            }
          }

          if (controller.signal.aborted) {
            return;
          }
        }

        // Step 3: Translate (optional)
        if (options.translateTo) {
          setState({ step: "translating", result: null, error: null });
          onStepChangeRef.current?.("translating");

          if (!isAvailable("translator")) {
            console.warn("Translator unavailable, skipping");
            skippedSteps.push("translate");
          } else {
            try {
              const translateResult = await translate(
                currentText,
                options.translateTo,
                options.sourceLang,
                controller.signal,
              );
              result.translated = translateResult;
              currentText = translateResult;
            } catch (error) {
              if (
                error instanceof AIError &&
                (error.code === "UNAVAILABLE" ||
                  error.code === "UNSUPPORTED_LANG")
              ) {
                console.warn(
                  `Translation to ${options.translateTo} unavailable, skipping`,
                );
                skippedSteps.push("translate");
              } else {
                throw error;
              }
            }
          }

          if (controller.signal.aborted) {
            return;
          }
        }

        // Pipeline complete
        result.final = currentText;
        setState({
          step: "done",
          result,
          error: null,
        });
        onStepChangeRef.current?.("done");
      } catch (error) {
        // Check if this was an abort
        if (controller.signal.aborted) {
          return;
        }

        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        setState({
          step: "error",
          result: null,
          error: errorObj,
        });
        onStepChangeRef.current?.("error");
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;

      setState({
        step: "idle",
        result: null,
        error: null,
      });
    }
  }, []);

  const setOnStepChange = useCallback(
    (callback: (step: PipelineStep) => void) => {
      onStepChangeRef.current = callback;
    },
    [],
  );

  return {
    step: state.step,
    result: state.result,
    error: state.error,
    run,
    cancel,
    setOnStepChange,
  };
}
