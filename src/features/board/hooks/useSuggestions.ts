import { useProofreader } from "@/shared/hooks/ai/useProofreader";
import { useRewriter, type RewriterTone } from "@/shared/hooks/ai/useRewriter";
import { useTranslator } from "@/shared/hooks/ai/useTranslator";
import { useWriter } from "@/shared/hooks/ai/useWriter";
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

  useEffect(() => {
    async function generateSuggestions() {
      if (!proofreader || !rewriter || !translator) {
        return;
      }

      const text = messageParts.map((part) => part.label).join(" ");

      try {
        const { correctedInput } = await proofreader.proofread(text);
        const rewritten = await rewriter.rewrite(correctedInput, {
          context: "",
        });
        const translated = await translator.translate(correctedInput);

        console.log("Original:", text);
        console.log("Proofread:", correctedInput);
        console.log("Rewritten:", rewritten);
        console.log("Translated:", translated);

        setSuggestions([correctedInput, rewritten, translated].filter(Boolean));
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    }

    generateSuggestions();
  }, [messageParts, context, tone, rewriter]);

  return {
    suggestions,
    tone,
    setTone,
  };
}
