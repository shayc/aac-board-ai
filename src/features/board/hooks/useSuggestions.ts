import { useProofreader } from "@/shared/hooks/ai/useProofreader";
import { useRewriter, type RewriterTone } from "@/shared/hooks/ai/useRewriter";
import type { BoardButton } from "@features/board/types";
import { useEffect, useState } from "react";
import type { MessagePart } from "./useMessage";

export interface UseSuggestionsInput {
  expectedInputLanguages?: string[];
  messageParts: MessagePart[];
  context?: BoardButton[];
  tone?: RewriterTone;
}

export function useSuggestions({
  expectedInputLanguages,
  messageParts,
  context,
  tone = "as-is",
}: UseSuggestionsInput) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const proofreader = useProofreader();
  const rewriter = useRewriter();

  useEffect(() => {
    async function generateSuggestions() {
      const proofreaderInstance = await proofreader.create({
        expectedInputLanguages,
      });

      const rewriterInstance = await rewriter.create({
        tone,
        format: "as-is",
        length: "shorter",
        sharedContext: context?.map((b) => b.label).join(", ") || "",
      });

      if (!proofreaderInstance || !rewriterInstance) {
        return;
      }

      const text = messageParts.map((part) => part.label).join(" ");
      console.log("Text to proofread:", text);

      try {
        const suggestions = await proofreaderInstance.proofread(text);
        const rewritten = await rewriterInstance.rewrite(
          suggestions.correctedInput,
          {
            context: "",
          }
        );
        setSuggestions([suggestions.correctedInput, rewritten]);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    }

    generateSuggestions();
  }, [messageParts, context]);

  return {
    suggestions,
  };
}
