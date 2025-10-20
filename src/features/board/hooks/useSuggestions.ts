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
    console.time("create proofreader");
    const proofreader = await createProofreader();
    console.timeEnd("create proofreader");

    console.time("create rewriter");
    const rewriter = await createRewriter({
      tone,
      length: "shorter",
      format: "plain-text",
    });
    console.timeEnd("create rewriter");

    const text = message.map((part) => part.label).join(" ");

    const proofread = await proofreader?.proofread(text);
    const rewritten = await rewriter?.rewrite(text);
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
