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
  type Status,
  useGlobalDownloadProgress,
  useProofreader,
  useRewriter,
} from "@shayc/react-built-in-ai";
import {
  deriveSuggestionStatus,
  type SuggestionStatusView,
} from "./derive-suggestion-status";
import { toPhrases } from "./to-phrases";

const SHARED_CONTEXT_DEBOUNCE_MS = 400;

interface UseSuggestionsReturn {
  isSupported: boolean;
  status: SuggestionStatusView;
  phrases: string[];
  enable: () => void;
}

interface SuggestionSource {
  engineStatus: Status;
  phrase: string | undefined;
  isPending: boolean;
  hasRequestFailed: boolean;
  enable: () => void;
}

interface UseRewriteSuggestionOptions {
  text: string;
  sharedContext: string;
  language: string;
  tone: "as-is" | "more-casual";
}

function isNonAbortError(error: Error | undefined): boolean {
  return error !== undefined && error.name !== "AbortError";
}

function useProofreadSuggestion(
  text: string,
  language: string,
): SuggestionSource {
  const proofreader = useProofreader(proofreaderLanguageOptions(language));
  const hasText = text.trim().length > 0;

  const request = useLatestAsync({
    enabled: hasText && proofreader.status === "ready",
    deps: [text, language],
    run: (signal) =>
      proofreader
        .proofread(text, { signal })
        .then((result) => result.correctedInput),
  });

  const enable = () => {
    if (proofreader.status === "downloadable") {
      prepareQuietly(proofreader);
    }
  };

  return {
    engineStatus: proofreader.status,
    phrase: request.value,
    isPending: request.isPending,
    hasRequestFailed: isNonAbortError(request.error),
    enable,
  };
}

function useRewriteSuggestion({
  text,
  sharedContext,
  language,
  tone,
}: UseRewriteSuggestionOptions): SuggestionSource {
  const rewriter = useRewriter({
    sharedContext,
    length: "shorter",
    format: "plain-text",
    tone,
    ...rewriterLanguageOptions(language),
  });
  const hasText = text.trim().length > 0;

  const request = useLatestAsync({
    enabled: hasText && rewriter.status === "ready",
    deps: [text, sharedContext, language],
    run: (signal) => rewriter.rewrite(text, { signal }),
  });

  const enable = () => {
    if (rewriter.status === "downloadable") {
      prepareQuietly(rewriter);
    }
  };

  return {
    engineStatus: rewriter.status,
    phrase: request.value,
    isPending: request.isPending,
    hasRequestFailed: isNonAbortError(request.error),
    enable,
  };
}

export function useSuggestions(text: string): UseSuggestionsReturn {
  const sharedContext = useAISharedContext();
  const debouncedSharedContext = useDebouncedValue(
    sharedContext,
    SHARED_CONTEXT_DEBOUNCE_MS,
  );

  const { language } = useLanguage();

  const proofreadSuggestion = useProofreadSuggestion(text, language);
  const directSuggestion = useRewriteSuggestion({
    text,
    sharedContext: debouncedSharedContext,
    language,
    tone: "as-is",
  });
  const friendlySuggestion = useRewriteSuggestion({
    text,
    sharedContext: debouncedSharedContext,
    language,
    tone: "more-casual",
  });

  const suggestionSources = [
    proofreadSuggestion,
    directSuggestion,
    friendlySuggestion,
  ];
  const hasText = text.trim().length > 0;

  // Other hook instances can start these downloads; global progress keeps the
  // suggestion bar in sync with them.
  const downloadProgress = useGlobalDownloadProgress([
    "Proofreader",
    "Rewriter",
  ]);

  const phrases = toPhrases(
    text,
    suggestionSources.map(({ phrase }) => phrase),
  );
  const isPending = suggestionSources.some(({ isPending }) => isPending);

  const status = deriveSuggestionStatus({
    engines: suggestionSources.map(({ engineStatus, hasRequestFailed }) => ({
      status: engineStatus,
      requestFailed: hasRequestFailed,
    })),
    downloadProgress,
    hasText,
    isPending,
    phraseCount: phrases.length,
  });

  const enable = () => {
    for (const source of suggestionSources) {
      source.enable();
    }
  };

  const isSupported = suggestionSources.some(
    ({ engineStatus }) => engineStatus !== "unsupported",
  );

  return {
    isSupported,
    status,
    phrases,
    enable,
  };
}
