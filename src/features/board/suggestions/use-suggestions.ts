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
import type { Board } from "../types";
import {
  deriveSuggestionStatus,
  type SuggestionStatusView,
} from "./derive-suggestion-status";
import { toPhrases } from "./to-phrases";
import { useWordPrediction } from "./use-word-prediction";

const SHARED_CONTEXT_DEBOUNCE_MS = 400;

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

  const { language } = useLanguage();

  const proofreader = useProofreader(proofreaderLanguageOptions(language));

  const rewriterOptions = {
    sharedContext: debouncedSharedContext,
    length: "shorter" as const,
    format: "plain-text" as const,
    ...rewriterLanguageOptions(language),
  };

  const directRewriter = useRewriter({
    ...rewriterOptions,
    tone: "as-is",
  });

  const friendlyRewriter = useRewriter({
    ...rewriterOptions,
    tone: "more-casual",
  });

  const prediction = useWordPrediction(text, board);

  const hasText = text.trim().length > 0;

  const corrected = useLatestAsync({
    enabled: hasText && proofreader.status === "ready",
    deps: [text, language],
    run: (signal) =>
      proofreader
        .proofread(text, { signal })
        .then((result) => result.correctedInput),
  });

  const directRewrite = useLatestAsync({
    enabled: hasText && directRewriter.status === "ready",
    deps: [text, debouncedSharedContext, language],
    run: (signal) => directRewriter.rewrite(text, { signal }),
  });

  const friendlyRewrite = useLatestAsync({
    enabled: hasText && friendlyRewriter.status === "ready",
    deps: [text, debouncedSharedContext, language],
    run: (signal) => friendlyRewriter.rewrite(text, { signal }),
  });

  const rewriterSuggestions = [
    { engine: directRewriter, request: directRewrite },
    { engine: friendlyRewriter, request: friendlyRewrite },
  ];

  // Other hook instances can start these downloads; global progress keeps the
  // suggestion bar in sync with them.
  const downloadProgress = useGlobalDownloadProgress([
    "Proofreader",
    "Rewriter",
    "LanguageModel",
  ]);

  const phrases = toPhrases(text, [
    corrected.value,
    directRewrite.value,
    friendlyRewrite.value,
    prediction.phrase,
  ]);

  const isPending =
    corrected.isPending ||
    rewriterSuggestions.some(({ request }) => request.isPending) ||
    prediction.isPending;

  const status = deriveSuggestionStatus({
    engines: [
      {
        status: proofreader.status,
        requestFailed: isNonAbortError(corrected.error),
      },
      ...rewriterSuggestions.map(({ engine, request }) => ({
        status: engine.status,
        requestFailed: isNonAbortError(request.error),
      })),
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

    for (const { engine } of rewriterSuggestions) {
      if (engine.status === "downloadable") {
        prepareQuietly(engine);
      }
    }

    prediction.enable();
  };

  const isSupported =
    proofreader.status !== "unsupported" ||
    rewriterSuggestions.some(({ engine }) => engine.status !== "unsupported") ||
    prediction.status !== "unsupported";

  return {
    isSupported,
    status,
    phrases,
    enable,
  };
}
