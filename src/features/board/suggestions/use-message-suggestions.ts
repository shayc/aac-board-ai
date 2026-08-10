import { useDebouncedValue } from "@shared/hooks/use-debounced-value";
import { useLanguage } from "@shared/language/use-language";
import { useGlobalDownloadProgress } from "@shayc/react-built-in-ai";
import {
  deriveSuggestionStatus,
  type SuggestionStatusView,
} from "./derive-suggestion-status";
import { useBoardSuggestionConfig } from "./suggestion-config-store";
import { toPhrases } from "./to-phrases";
import { useProofreadSuggestion } from "./use-proofread-suggestion";
import { useRewriteSuggestion } from "./use-rewrite-suggestion";

const CUSTOM_INSTRUCTIONS_DEBOUNCE_MS = 400;

interface MessageSuggestions {
  isSupported: boolean;
  status: SuggestionStatusView;
  phrases: string[];
  enable: () => void;
}

export function useMessageSuggestions(text: string): MessageSuggestions {
  const { customInstructions } = useBoardSuggestionConfig();
  const debouncedCustomInstructions = useDebouncedValue(
    customInstructions,
    CUSTOM_INSTRUCTIONS_DEBOUNCE_MS,
  );

  const { language } = useLanguage();

  const proofreading = useProofreadSuggestion(text, language);
  const sameToneRewrite = useRewriteSuggestion({
    text,
    customInstructions: debouncedCustomInstructions,
    language,
    tone: "as-is",
  });
  const casualRewrite = useRewriteSuggestion({
    text,
    customInstructions: debouncedCustomInstructions,
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
