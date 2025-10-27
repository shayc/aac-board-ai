import { useProofreader } from "@/shared/hooks/ai/useProofreader";
import { useRewriter } from "@/shared/hooks/ai/useRewriter";
import { useEffect, useRef, useState } from "react";
import type { MessagePart } from "./useMessage";

export function useSuggestions(message: MessagePart[], sharedContext?: string) {
  const { createProofreader } = useProofreader();
  const { createRewriter } = useRewriter();

  const [tone, setTone] = useState<RewriterTone>("as-is");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  async function generateSuggestions(
    text: string,
    tone: RewriterTone,
    sharedContext?: string
  ) {
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    try {
      const proofreader = await createProofreader();
      const rewriter = await createRewriter({
        tone,
        length: "shorter",
        format: "plain-text",
        sharedContext: sharedContext || undefined,
      });

      const [proofread, rewritten] = await Promise.all([
        proofreader?.proofread(text, { signal }),
        rewriter?.rewrite(text, { signal }),
      ]);

      if (signal.aborted) {
        return;
      }

      const suggestions = [
        proofread?.correctedInput || "",
        rewritten || "",
      ].filter((s) => s && !s.match(/\b[A-Za-z]+_[A-Za-z]+\b/));

      const uniqueSuggestions = Array.from(new Set(suggestions));

      setSuggestions(uniqueSuggestions);
    } catch (error) {
      if ((error as DOMException).name === "AbortError") {
        return;
      }

      console.error("generateSuggestions failed:", error);
    }
  }

  useEffect(() => {
    const text = message.map((part) => part.label).join(" ");
    generateSuggestions(text, tone, sharedContext);

    return () => abortRef.current?.abort();
  }, [message, tone, sharedContext]);

  return {
    suggestions,
    generateSuggestions,
    suggestionTone: tone,
    setSuggestionTone: setTone,
  };
}
