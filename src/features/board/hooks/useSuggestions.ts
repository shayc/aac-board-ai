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
        const rewritten = await rewriter.rewrite(correctedInput, {
          context: "",
        });
        const translated = await translator.translate(correctedInput);

        // let promptSuggestion = "";
        // if (session && context && context.length > 0) {
        //   const contextWords = context.map((button) => button.label).join(", ");
        //   const instruction = `complete the following text ${text} with only one word from the following words: ${contextWords}`;
        //   promptSuggestion = await session.prompt(instruction);
        // }

        setSuggestions(
          [correctedInput, rewritten, translated].filter(
            Boolean
          )
        );
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    }

    generateSuggestions();
  }, [messageParts, context, tone, rewriter, session]);

  return {
    suggestions,
    tone,
    setTone,
  };
}
