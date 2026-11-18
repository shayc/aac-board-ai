import { useDebouncedValue } from "@shared/hooks/use-debounced-value";
import { useGlobalDownloadProgress } from "@shayc/react-built-in-ai";
import {
  deriveSuggestionStatus,
  type SuggestionStatus,
} from "./derive-suggestion-status";
import { selectSuggestionPhrases } from "./select-suggestion-phrases";
import { useSuggestionPreferences } from "./suggestion-preferences-store";
import {
  isAvailableEngineStatus,
  SUGGESTION_ENGINES,
} from "./suggestion-support";
import { useProofreaderSource } from "./use-proofreader-source";
import { useRewriterSource } from "./use-rewriter-source";

const CUSTOM_INSTRUCTIONS_DEBOUNCE_MS = 400;

interface UseMessageSuggestionsOptions {
  messageText: string;
  language: string;
}

interface UseMessageSuggestionsReturn {
  isAvailable: boolean;
  phrases: readonly string[];
  status: SuggestionStatus;
  enable: () => void;
}

export function useMessageSuggestions({
  messageText,
  language,
}: UseMessageSuggestionsOptions): UseMessageSuggestionsReturn {
  const text = messageText.trim();

  const { customInstructions } = useSuggestionPreferences();
  const debouncedCustomInstructions = useDebouncedValue(
    customInstructions,
    CUSTOM_INSTRUCTIONS_DEBOUNCE_MS,
  );

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
  const downloadProgress = useGlobalDownloadProgress(SUGGESTION_ENGINES);

  const hasText = text !== "";
  const sources = [proofreaderSource, rewriterSource, casualRewriterSource];
  const isAvailable = sources.some(({ engineStatus }) =>
    isAvailableEngineStatus(engineStatus),
  );
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
    isAvailable,
    phrases,
    status,
    enable,
  };
}
