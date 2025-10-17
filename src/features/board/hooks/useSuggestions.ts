import { useProofreader } from "@/shared/hooks/ai/useProofreader";
import { usePrompt } from "@/shared/hooks/ai/usePrompt";
import { useRewriter, type RewriterTone } from "@/shared/hooks/ai/useRewriter";
import { useTranslator } from "@/shared/hooks/ai/useTranslator";
import type { BoardButton } from "@features/board/types";
import { useEffect, useState } from "react";
import type { MessagePart } from "./useMessage";
import { useLanguageDetector } from "@/shared/hooks/ai/useLanguageDetector";

export interface UseSuggestionsInput {
  expectedInputLanguages?: string[];
  messageParts: MessagePart[];
  context?: BoardButton[];
}

export function useSuggestions({
  expectedInputLanguages,
  messageParts,
  context,
}: UseSuggestionsInput) {
  const [sourceLanguage, setSourceLanguage] = useState<
    { confidence: number; detectedLanguage: string }[]
  >([]);
  const [suggestionTone, setSuggestionTone] = useState<RewriterTone>("as-is");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsStatus, setSuggestionsStatus] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle');
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const { languageDetector } = useLanguageDetector();
  const { proofreader } = useProofreader({ expectedInputLanguages });
  const { rewriter } = useRewriter({
    tone: suggestionTone,
    format: "as-is",
    length: "shorter",
  });

  const { translator } = useTranslator({
    sourceLanguage: sourceLanguage[0]?.detectedLanguage || "en",
    targetLanguage: "he",
  });

  const { session } = usePrompt();

  useEffect(() => {
    async function generateSuggestions() {
      if (!proofreader || !rewriter || !translator) {
        setSuggestionsStatus('idle');
        return;
      }

      const text = messageParts.map((part) => part.label).join(" ");
      
      // Don't generate if no message
      if (!text.trim()) {
        setSuggestionsStatus('idle');
        setSuggestions([]);
        return;
      }

      setSuggestionsStatus('generating');
      setSuggestionsError(null);

      try {
        const sourceLanguage = await languageDetector?.detect(
          messageParts.map((part) => part.label).join(" ")
        );
        const { correctedInput } = await proofreader.proofread(text);
        const rewritten = await rewriter.rewrite(correctedInput);
        const promptSuggestion = await session?.prompt(
          `Complete this sentence: "${correctedInput}", you may only use up to five words from the following list: ${context
            ?.map((c) => `"${c.label}"`)
            .join(
              ", "
            )}. Output only the completed sentence without any additional text. If you cannot complete the sentence using the provided words, respond with "GIVEN_TEXT".`
        );
        setSourceLanguage(sourceLanguage || "en");
        setSuggestions(
          [correctedInput, rewritten, promptSuggestion].filter(
            (s): s is string => !s.includes("GIV  EN_TEXT") && !!s
          )
        );
        setSuggestionsStatus('ready');
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestionsError(error instanceof Error ? error.message : 'Failed to generate suggestions');
        setSuggestionsStatus('error');
      }
    }

    generateSuggestions();
  }, [messageParts, context, suggestionTone]);

  return {
    suggestions,
    suggestionsStatus,
    suggestionsError,
    suggestionTone,
    setSuggestionTone,
  };
}
