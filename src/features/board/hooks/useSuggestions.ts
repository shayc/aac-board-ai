import { useProofreader } from "@/shared/hooks/ai/useProofreader";
import { useRewriter } from "@/shared/hooks/ai/useRewriter";
import { useEffect, useState } from "react";
import type { MessagePart } from "./useMessage";

export function useSuggestions(message: MessagePart[]) {
  const [tone, setTone] = useState<RewriterTone>("as-is");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const { createProofreader } = useProofreader();
  const { createRewriter } = useRewriter();

  async function generateSuggestions(
    text: string,
    tone: RewriterTone = "as-is"
  ) {
    const proofreader = await createProofreader();
    const rewriter = await createRewriter({
      tone,
      length: "shorter",
      format: "plain-text",
    });

    const [proofread, rewritten] = await Promise.all([
      proofreader?.proofread(text),
      rewriter?.rewrite(text),
    ]);

    const suggestions = [proofread?.correctedInput || "", rewritten || ""];
    const uniqueSuggestions = Array.from(new Set(suggestions)).filter(
      (s) => s && !s?.match(/\b[A-Z]+_[A-Z]+\b/)
    );

    setSuggestions(uniqueSuggestions);
  }

  useEffect(() => {
    const text = message.map((part) => part.label).join(" ");
    generateSuggestions(text, tone);
  }, [message, tone]);

  return {
    suggestions,
    generateSuggestions,
    suggestionTone: tone,
    setSuggestionTone: setTone,
  };
}
