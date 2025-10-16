import { useProofreader } from "@/shared/hooks/ai/useProofreader";
import { useRewriter, type RewriterTone } from "@/shared/hooks/ai/useRewriter";
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

  useEffect(() => {
    async function generateSuggestions() {
      if (!proofreader || !rewriter) {
        return;
      }

      const text = messageParts.map((part) => part.label).join(" ");
      console.log("Text to proofread:", text);

      try {
        const { correctedInput } = await proofreader.proofread(text);
        const rewritten = await rewriter.rewrite(correctedInput, {
          context: "",
        });

        console.log("Corrected Input:", correctedInput);
        console.log("Rewritten:", rewritten);

        setSuggestions([correctedInput, rewritten].filter(Boolean));
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
