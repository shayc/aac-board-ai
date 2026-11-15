import { useDebouncedValue } from "@shared/hooks/use-debounced-value";
import { useCommunicationLanguage } from "@shared/language/language-store";
import { useGlobalDownloadProgress } from "@shayc/react-built-in-ai";
import {
  deriveSuggestionStatus,
  type SuggestionStatus,
} from "./derive-suggestion-status";
import { selectSuggestionPhrases } from "./select-suggestion-phrases";
import { useSuggestionPreferences } from "./suggestion-preferences-store";
import { isEngineUsable, SUGGESTION_ENGINES } from "./suggestion-support";
import { useNextWordSource } from "./use-next-word-source";
import { useProofreaderSource } from "./use-proofreader-source";
import { useRewriterSource } from "./use-rewriter-source";

const CUSTOM_INSTRUCTIONS_DEBOUNCE_MS = 400;
const DOWNLOAD_ENGINES = [...SUGGESTION_ENGINES, "LanguageModel"] as const;

interface UseMessageSuggestionsReturn {
  isAvailable: boolean;
  status: SuggestionStatus;
  phrases: readonly string[];
  nextWords: readonly string[];
  enable: () => void;
}

export function useMessageSuggestions(
  messageText: string,
  vocabulary: readonly string[],
): UseMessageSuggestionsReturn {
  const text = messageText.trim();

  const { customInstructions } = useSuggestionPreferences();
  const debouncedCustomInstructions = useDebouncedValue(
    customInstructions,
    CUSTOM_INSTRUCTIONS_DEBOUNCE_MS,
  );

  const { language } = useCommunicationLanguage();
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
  const nextWordSource = useNextWordSource({ text, vocabulary, language });
  const downloadProgress = useGlobalDownloadProgress(DOWNLOAD_ENGINES);

  const hasText = text !== "";
  const sources = [proofreaderSource, rewriterSource, casualRewriterSource];
  const phrases = selectSuggestionPhrases(
    text,
    sources.map(({ candidate }) => candidate),
  );
  const nextWords = nextWordSource.words;
  const allSources = [...sources, nextWordSource];
  const isAvailable = allSources.some(({ engineStatus }) =>
    isEngineUsable(engineStatus),
  );
  const status = deriveSuggestionStatus({
    sources: allSources,
    downloadProgress,
    hasText,
    phraseCount: phrases.length + nextWords.length,
  });

  function enable() {
    for (const source of allSources) {
      source.enable();
    }
  }

  return {
    isAvailable,
    status,
    phrases,
    nextWords,
    enable,
  };
}
