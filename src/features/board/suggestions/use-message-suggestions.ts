import { useDebouncedValue } from "@shared/hooks/use-debounced-value";
import { useLanguage } from "@shared/language/use-language";
import { useGlobalDownloadProgress } from "@shayc/react-built-in-ai";
import {
  deriveSuggestionStatus,
  type SuggestionStatus,
} from "./derive-suggestion-status";
import { useSuggestionPreferences } from "./suggestion-preferences-store";
import { selectSuggestionPhrases } from "./select-suggestion-phrases";
import {
  areSuggestionsSupported,
  SUGGESTION_ENGINES,
} from "./suggestion-support";
import { useProofreaderSource } from "./use-proofreader-source";
import { useRewriterSource } from "./use-rewriter-source";

const CUSTOM_INSTRUCTIONS_DEBOUNCE_MS = 400;

interface UseMessageSuggestionsReturn {
  isSupported: boolean;
  status: SuggestionStatus;
  phrases: string[];
  language: string;
  enable: () => void;
}

export function useMessageSuggestions(
  messageText: string,
): UseMessageSuggestionsReturn {
  const text = messageText.trim();
  const hasText = text !== "";

  const { customInstructions } = useSuggestionPreferences();
  const debouncedCustomInstructions = useDebouncedValue(
    customInstructions,
    CUSTOM_INSTRUCTIONS_DEBOUNCE_MS,
  );

  const { language } = useLanguage();

  const proofreaderSource = useProofreaderSource({ text, language });
  const rewriterSource = useRewriterSource({
    text,
    customInstructions: debouncedCustomInstructions,
    language,
    tone: "as-is",
  });
  const casualRewriterSource = useRewriterSource({
    text,
    customInstructions: debouncedCustomInstructions,
    language,
    tone: "more-casual",
  });

  const sources = [proofreaderSource, rewriterSource, casualRewriterSource];

  // Other hook instances can start these downloads; global progress keeps the
  // suggestion bar in sync with them.
  const downloadProgress = useGlobalDownloadProgress(SUGGESTION_ENGINES);

  const phrases = selectSuggestionPhrases(
    text,
    sources.map(({ candidate }) => candidate),
  );
  const status = deriveSuggestionStatus({
    sources,
    downloadProgress,
    hasText,
    phraseCount: phrases.length,
  });

  function enable() {
    for (const source of sources) {
      source.enable();
    }
  }

  return {
    isSupported: areSuggestionsSupported(),
    status,
    phrases,
    language,
    enable,
  };
}
