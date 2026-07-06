import {
  proofreaderLanguageOptions,
  rewriterLanguageOptions,
} from "@shared/built-in-ai/engine-language-options";
import { prepareQuietly } from "@shared/built-in-ai/prepare-quietly";
import { useAISharedContext } from "@shared/built-in-ai/shared-context-store";
import { useAITone } from "@shared/built-in-ai/tone-store";
import { useDebouncedValue } from "@shared/hooks/use-debounced-value";
import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useLanguage } from "@shared/language/use-language";
import {
  useGlobalDownloadProgress,
  useProofreader,
  useRewriter,
} from "@shayc/react-built-in-ai";
import type { Board } from "../types";
import {
  deriveSuggestionStatus,
  type SuggestionStatusView,
} from "./derive-suggestion-status";
import { toPhrases } from "./to-phrases";
import { useTilePrediction } from "./use-tile-prediction";

const SHARED_CONTEXT_DEBOUNCE_MS = 400;
const TONE_DEBOUNCE_MS = 400;

export interface UseSuggestionsReturn {
  isSupported: boolean;
  status: SuggestionStatusView;
  phrases: string[];
  enable: () => void;
}

function isNonAbortError(error: Error | undefined): boolean {
  return error !== undefined && error.name !== "AbortError";
}

export function useSuggestions(
  text: string,
  board: Board,
): UseSuggestionsReturn {
  const sharedContext = useAISharedContext();
  const debouncedSharedContext = useDebouncedValue(
    sharedContext,
    SHARED_CONTEXT_DEBOUNCE_MS,
  );

  const tone = useAITone();
  const debouncedTone = useDebouncedValue(tone, TONE_DEBOUNCE_MS);
  const { language } = useLanguage();

  const proofreader = useProofreader(proofreaderLanguageOptions(language));

  const rewriter = useRewriter({
    tone: debouncedTone,
    sharedContext: debouncedSharedContext,
    length: "shorter",
    format: "plain-text",
    ...rewriterLanguageOptions(language),
  });

  const prediction = useTilePrediction(text, board);

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
    deps: [text, debouncedTone, debouncedSharedContext, language],
    fetch: (signal) => rewriter.rewrite(text, { signal }),
  });

  // Settings' Download action provisions its own hook instances; only the
  // global store sees the downloads they start.
  const downloadProgress = useGlobalDownloadProgress([
    "Proofreader",
    "Rewriter",
    "LanguageModel",
  ]);

  // The prediction rides in as a regular phrase chip (the full sentence so far
  // plus the predicted next words, assembled inside the hook against its own
  // debounced text). It's listed last — the proofread (fastest) and rewrite
  // land first; existing dedupe/clean rules then apply unchanged.
  const phrases = toPhrases(text, [
    corrected.value,
    rewritten.value,
    prediction.phrase,
  ]);
  const isPending =
    corrected.isPending || rewritten.isPending || prediction.isPending;

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
      {
        status: prediction.status,
        requestFailed: prediction.requestFailed,
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

    prediction.enable();
  };

  const isSupported =
    proofreader.status !== "unsupported" ||
    rewriter.status !== "unsupported" ||
    prediction.status !== "unsupported";

  return {
    isSupported,
    status,
    phrases,
    enable,
  };
}
