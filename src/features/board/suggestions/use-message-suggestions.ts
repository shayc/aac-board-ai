import { useAISharedContext } from "@shared/built-in-ai/shared-context-store";
import { useDebouncedValue } from "@shared/hooks/use-debounced-value";
import { useLanguage } from "@shared/language/use-language";
import { useGlobalDownloadProgress } from "@shayc/react-built-in-ai";
import {
  deriveSuggestionStatus,
  type SuggestionStatusView,
} from "./derive-suggestion-status";
import { toPhrases } from "./to-phrases";
import { useProofreadSuggestion } from "./use-proofread-suggestion";
import { useRewriteSuggestion } from "./use-rewrite-suggestion";

const SHARED_CONTEXT_DEBOUNCE_MS = 400;

interface MessageSuggestions {
  isSupported: boolean;
  status: SuggestionStatusView;
  phrases: string[];
  enable: () => void;
}

export function useMessageSuggestions(text: string): MessageSuggestions {
  const sharedContext = useAISharedContext();
  const debouncedSharedContext = useDebouncedValue(
    sharedContext,
    SHARED_CONTEXT_DEBOUNCE_MS,
  );

  const { language } = useLanguage();

  const proofreading = useProofreadSuggestion(text, language);
  const sameToneRewrite = useRewriteSuggestion({
    text,
    sharedContext: debouncedSharedContext,
    language,
    tone: "as-is",
  });
  const casualRewrite = useRewriteSuggestion({
    text,
    sharedContext: debouncedSharedContext,
    language,
    tone: "more-casual",
  });

  const sources = [proofreading, sameToneRewrite, casualRewrite];
  const hasText = text.trim().length > 0;

  // Other hook instances can start these downloads; global progress keeps the
  // suggestion bar in sync with them.
  const downloadProgress = useGlobalDownloadProgress([
    "Proofreader",
    "Rewriter",
  ]);

  const phrases = toPhrases(
    text,
    sources.map(({ candidate }) => candidate),
  );
  const isPending = sources.some(({ isRequestPending }) => isRequestPending);

  const status = deriveSuggestionStatus({
    engines: sources.map(({ engineStatus, hasRequestFailed }) => ({
      status: engineStatus,
      requestFailed: hasRequestFailed,
    })),
    downloadProgress,
    hasText,
    isPending,
    phraseCount: phrases.length,
  });

  const enable = () => {
    for (const source of sources) {
      source.prepare();
    }
  };

  const isSupported = sources.some(
    ({ engineStatus }) => engineStatus !== "unsupported",
  );

  return {
    isSupported,
    status,
    phrases,
    enable,
  };
}
