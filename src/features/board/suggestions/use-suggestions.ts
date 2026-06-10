import { useAISharedContext } from "@shared/hooks/use-ai-shared-context";
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
  proofreaderLanguageOptions,
  rewriterLanguageOptions,
} from "./engine-language-options";
import {
  deriveSuggestionStatus,
  type SuggestionStatusView,
} from "./derive-suggestion-status";
import { toPhrases } from "./to-phrases";
import { useEngineView } from "./use-engine-view";

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

// Distinguishes real call failures from cancellations, wherever the abort
// originated.
function isRealError(error: Error | undefined): boolean {
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

  const proofreaderView = useEngineView("Proofreader", language, proofreader);
  const rewriterView = useEngineView("Rewriter", language, rewriter);

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

  // The global store also sees downloads the onboarding warm-up started, which
  // the hook instances can't.
  const downloadProgress = useGlobalDownloadProgress([
    "Proofreader",
    "Rewriter",
  ]);

  const phrases = toPhrases(text, [corrected.value, rewritten.value]);
  const isPending = corrected.isPending || rewritten.isPending;

  const status = deriveSuggestionStatus({
    engines: [
      { view: proofreaderView, roundFailed: isRealError(corrected.error) },
      { view: rewriterView, roundFailed: isRealError(rewritten.error) },
    ],
    downloadProgress,
    hasText,
    isPending,
    phraseCount: phrases.length,
  });

  const enable = () => {
    if (proofreaderView.kind === "awaits-gesture") {
      void proofreader.prepare().catch(() => undefined);
    }
    if (rewriterView.kind === "awaits-gesture") {
      void rewriter.prepare().catch(() => undefined);
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
