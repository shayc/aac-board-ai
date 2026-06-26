import {
  proofreaderLanguageOptions,
  rewriterLanguageOptions,
} from "@shared/built-in-ai/engine-language-options";
import { prepareQuietly } from "@shared/built-in-ai/prepare-quietly";
import { useAISharedContext } from "@shared/built-in-ai/shared-context-store";
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
import {
  deriveToneControlState,
  type ToneControlState,
} from "./derive-tone-control-state";
import { toPhrases } from "./to-phrases";

const SHARED_CONTEXT_DEBOUNCE_MS = 400;

export interface UseSuggestionsReturn {
  isSupported: boolean;
  status: SuggestionStatusView;
  phrases: string[];
  toneControlState: ToneControlState;
  tone: RewriterTone;
  setTone: (tone: RewriterTone) => void;
  enable: () => void;
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

  const downloadProgress = useGlobalDownloadProgress([
    "Proofreader",
    "Rewriter",
  ]);

  const phrases = toPhrases(text, [corrected.value, rewritten.value]);
  const isPending = corrected.isPending || rewritten.isPending;

  const status = deriveSuggestionStatus({
    engines: [
      {
        status: proofreader.status,
        requestFailed: isNonAbortError(corrected.error),
      },
      {
        status: rewriter.status,
        requestFailed: isNonAbortError(rewritten.error),
      },
    ],
    downloadProgress,
    hasText,
    isPending,
    phraseCount: phrases.length,
  });

  const enable = () => {
    if (proofreader.status === "downloadable") {
      prepareQuietly(proofreader);
    }

    if (rewriter.status === "downloadable") {
      prepareQuietly(rewriter);
    }
  };

  const isSupported =
    proofreader.status !== "unsupported" || rewriter.status !== "unsupported";
  const toneControlState = deriveToneControlState(rewriter.status);

  return {
    isSupported,
    status,
    phrases,
    toneControlState,
    tone,
    setTone,
    enable,
  };
}
