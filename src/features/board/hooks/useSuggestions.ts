import { useProofreader } from "@/shared/hooks/ai/useProofreader";
import { usePrompt } from "@/shared/hooks/ai/usePrompt";
import { useRewriter, type RewriterTone } from "@/shared/hooks/ai/useRewriter";
import { useTranslator } from "@/shared/hooks/ai/useTranslator";
import type { BoardButton } from "@features/board/types";
import { useEffect, useState } from "react";
import type { MessagePart } from "./useMessage";

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
  const [tone, setTone] = useState<RewriterTone>("as-is");

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { proofreader } = useProofreader({ expectedInputLanguages });
  const { rewriter } = useRewriter({
    tone,
    format: "as-is",
    length: "shorter",
  });

  const { translator } = useTranslator({
    sourceLanguage: "en",
    targetLanguage: "he",
  });

  const { session } = usePrompt();

  useEffect(() => {
    async function generateSuggestions() {
      if (!proofreader || !rewriter || !translator) {
        return;
      }

      const text = messageParts.map((part) => part.label).join(" ");

      try {
        const { correctedInput } = await proofreader.proofread(text);
        const rewritten = await rewriter.rewrite(correctedInput);
        const promptSuggestion = await session?.prompt(
          `Complete this sentence: "${correctedInput}", you may only use up to five words from the following list: ${context
            ?.map((c) => `"${c.label}"`)
            .join(
              ", "
            )}. Output only the completed sentence without any additional text. If you cannot complete the sentence using the provided words, respond with "GIVEN_TEXT".`
        );

        setSuggestions(
          [correctedInput, rewritten, promptSuggestion].filter(
            (s): s is string => !s.includes("GIV  EN_TEXT") && !!s
          )
        );
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    }

    generateSuggestions();
  }, [messageParts, context, tone]);

  return {
    suggestions,
    tone,
    setTone,
  };
}
