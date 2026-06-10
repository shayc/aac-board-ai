import {
  proofreaderLanguageOptions,
  rewriterLanguageOptions,
} from "@shared/built-in-ai/engine-language-options";
import { deriveEngineView } from "@shared/built-in-ai/engine-view";
import { prepareQuietly } from "@shared/built-in-ai/prepare-quietly";
import { useAISharedContext } from "@shared/built-in-ai/use-ai-shared-context";
import { useDebouncedValue } from "@shared/hooks/use-debounced-value";
import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useLanguage } from "@shared/language/use-language";
import {
  useGlobalDownloadProgress,
  useProofreader,
  useRewriter,
} from "@shayc/react-built-in-ai";
import { useState } from "react";
import {
  deriveSuggestionStatus,
  type SuggestionStatusView,
} from "./derive-suggestion-status";
import { toPhrases } from "./to-phrases";

const SHARED_CONTEXT_DEBOUNCE_MS = 400;

export interface UseSuggestionsReturn {
  isSupported: boolean;
  isProofreaderSupported: boolean;
  isRewriterSupported: boolean;
  proofreaderError: Error | undefined;
  rewriterError: Error | undefined;
  status: SuggestionStatusView;
  enable: () => void;
  phrases: string[];
  tone: RewriterTone;
  setTone: (tone: RewriterTone) => void;
}

function isNonAbortError(error: Error | undefined): boolean {
  return error !== undefined && error.name !== "AbortError";
}

export function useSuggestions(text: string): UseSuggestionsReturn {
  const sharedContext = useAISharedContext();
  const debouncedSharedContext = useDebouncedValue(
    sharedContext,
    SHARED_CONTEXT_DEBOUNCE_MS,
  );

  const [tone, setTone] = useState<RewriterTone>("as-is");
  const { language } = useLanguage();

  const proofreader = useProofreader(proofreaderLanguageOptions(language));

  const rewriter = useRewriter({
    tone,
    sharedContext: debouncedSharedContext,
    length: "shorter",
    format: "plain-text",
    ...rewriterLanguageOptions(language),
  });

  const proofreaderView = deriveEngineView(proofreader);
  const rewriterView = deriveEngineView(rewriter);

  const hasText = text.trim().length > 0;

  const corrected = useLatestAsync({
    enabled: hasText && proofreader.status === "ready",
    deps: [text, language],
    fetch: (signal) =>
      proofreader
        .proofread(text, { signal })
        .then((result) => result.correctedInput),
  });

  const rewritten = useLatestAsync({
    enabled: hasText && rewriter.status === "ready",
    deps: [text, tone, debouncedSharedContext, language],
    fetch: (signal) => rewriter.rewrite(text, { signal }),
  });

  // Settings' Download action provisions its own hook instances; only the
  // global store sees the downloads they start.
  const downloadProgress = useGlobalDownloadProgress([
    "Proofreader",
    "Rewriter",
  ]);

  const phrases = toPhrases(text, [corrected.value, rewritten.value]);
  const isPending = corrected.isPending || rewritten.isPending;

  const status = deriveSuggestionStatus({
    engines: [
      {
        view: proofreaderView,
        requestFailed: isNonAbortError(corrected.error),
      },
      {
        view: rewriterView,
        requestFailed: isNonAbortError(rewritten.error),
      },
    ],
    downloadProgress,
    hasText,
    isPending,
    phraseCount: phrases.length,
  });

  const enable = () => {
    if (proofreaderView.kind === "awaits-gesture") {
      prepareQuietly(proofreader);
    }
    if (rewriterView.kind === "awaits-gesture") {
      prepareQuietly(rewriter);
    }
  };

  const isProofreaderSupported = proofreaderView.kind !== "unsupported";
  const isRewriterSupported = rewriterView.kind !== "unsupported";

  return {
    isSupported: isProofreaderSupported || isRewriterSupported,
    isProofreaderSupported,
    isRewriterSupported,
    proofreaderError: corrected.error,
    rewriterError: rewritten.error,
    status,
    enable,
    phrases,
    tone,
    setTone,
  };
}
