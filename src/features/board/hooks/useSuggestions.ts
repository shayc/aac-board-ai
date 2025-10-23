import { useProofreader } from "@/shared/hooks/ai/useProofreader";
import { useRewriter } from "@/shared/hooks/ai/useRewriter";
import { useState } from "react";
import type { MessagePart } from "./useMessage";

export function useSuggestions() {
  const [tone, setTone] = useState<RewriterTone>("as-is");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const { createProofreader } = useProofreader();
  const { createRewriter } = useRewriter();

  async function generateSuggestions(
    message: MessagePart[],
    tone: RewriterTone
  ) {
    const proofreader = await createProofreader();

    const traits = {
      sarcastic:
        "Rewrite with clever, deadpan sarcasm. Keep meaning intact while expressing irony and humor.",
      polite:
        "Rewrite with respectful, professional phrasing. Keep tone composed and considerate.",
      playful:
        "Rewrite with a lighthearted, curious tone. Use humor and creative rhythm while staying clear.",
    };

    const rewriter = await createRewriter({
      tone,
      length: "shorter",
      format: "plain-text",
      sharedContext: `${traits.polite}`,
    });

    const text = message.map((part) => part.label).join(" ");

    const [proofread, rewritten] = await Promise.all([
      proofreader?.proofread(text),
      rewriter?.rewrite(text),
    ]);

    const suggestions = [proofread?.correctedInput || "", rewritten || ""];
    const uniqueSuggestions = Array.from(new Set(suggestions)).filter(
      (s) => s && !s.includes("GIVEN_TEXT")
    );

    setSuggestions(uniqueSuggestions);
  }

  return {
    suggestions,
    generateSuggestions,
    suggestionTone: tone,
    setSuggestionTone: setTone,
  };
}
