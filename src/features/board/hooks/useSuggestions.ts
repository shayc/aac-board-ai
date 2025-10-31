import { useProofreader } from "@shared/hooks/ai/useProofreader";
import { useRewriter } from "@shared/hooks/ai/useRewriter";
import { useEffect, useRef, useState } from "react";
import type { MessagePart } from "./useMessage";

export function useSuggestions(message: MessagePart[], sharedContext?: string) {
  const { createProofreader } = useProofreader();
  const { createRewriter } = useRewriter();

  const [tone, setTone] = useState<RewriterTone>("as-is");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const generateSuggestions = async (
      text: string,
      tone: RewriterTone,
      sharedContext?: string
    ) => {
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;
      const { signal } = controller;

      try {
        const proofreader = await createProofreader();
        const rewriter = await createRewriter({
          tone,
          sharedContext,
          length: "shorter",
          format: "plain-text",
        });

        const [proofread, rewritten] = await Promise.all([
          proofreader?.proofread(text, { signal }),
          rewriter?.rewrite(text, { signal }),
        ]);

        if (signal.aborted) {
          return;
        }

        const suggestions = [
          proofread?.correctedInput ?? "",
          rewritten ?? "",
        ].filter(
          (s) => s && !/\b[A-Za-z]+_[A-Za-z]+\b/.exec(s) && !s.includes('"')
        );

        const uniqueSuggestions = Array.from(new Set(suggestions));

        setSuggestions(uniqueSuggestions);
      } catch (error) {
        if ((error as DOMException).name === "AbortError") {
          return;
        }

        console.error("generateSuggestions failed:", error);
      }
    };

    const text = message.map((part) => part.label).join(" ");
    void generateSuggestions(text, tone, sharedContext);

    return () => abortRef.current?.abort();
  }, [message, tone, sharedContext, createProofreader, createRewriter]);

  return {
    suggestions,
    suggestionTone: tone,
    setSuggestionTone: setTone,
  };
}
