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
import { useContinuationSource } from "./use-continuation-source";
import { useProofreaderSource } from "./use-proofreader-source";
import { useRewriterSource } from "./use-rewriter-source";

const CUSTOM_INSTRUCTIONS_DEBOUNCE_MS = 400;

interface UseMessageSuggestionsOptions {
  messageText: string;
  language: string;
  vocabulary: readonly string[];
  isWordOpen: boolean;
}

interface UseMessageSuggestionsReturn {
  isAvailable: boolean;
  phrases: readonly string[];
  status: SuggestionStatus;
  continuations: readonly (readonly string[])[];
  enable: () => void;
}

export function useMessageSuggestions({
  messageText,
  language,
  vocabulary,
  isWordOpen,
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
  const continuationSource = useContinuationSource({
    text,
    vocabulary,
    isWordOpen,
    language,
  });
  const downloadProgress = useGlobalDownloadProgress(SUGGESTION_ENGINES);

  const hasText = text !== "";
  const sources = [proofreaderSource, rewriterSource, casualRewriterSource];
  const allSources = [...sources, continuationSource];
  const isAvailable = allSources.some(({ engineStatus }) =>
    isAvailableEngineStatus(engineStatus),
  );
  const phrases = selectSuggestionPhrases(
    text,
    sources.map(({ candidate }) => candidate),
  );
  const { continuations } = continuationSource;
  const status = deriveSuggestionStatus({
    sources: allSources,
    downloadProgress,
    hasText,
    phraseCount: phrases.length + continuations.length,
  });

  function enable() {
    for (const source of allSources) {
      source.enable();
    }
  }

  return {
    isAvailable,
    phrases,
    status,
    continuations,
    enable,
  };
}
