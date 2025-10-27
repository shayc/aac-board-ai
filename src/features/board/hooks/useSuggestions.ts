import { usePrompt } from "@/shared/hooks/ai/usePrompt";
import { useProofreader } from "@/shared/hooks/ai/useProofreader";
import { useRewriter } from "@/shared/hooks/ai/useRewriter";
import { useEffect, useRef, useState } from "react";
import type { Board } from "../types";
import type { MessagePart } from "./useMessage";

export function useSuggestions(message: MessagePart[], board: Board | null) {
  const [tone, setTone] = useState<RewriterTone>("as-is");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const { createProofreader } = useProofreader();
  const { createRewriter } = useRewriter();
  const { createSession } = usePrompt(board?.buttons.map((b) => b.label || ""));

  const abortRef = useRef<AbortController | null>(null);

  async function generateSuggestions(
    text: string,
    tone: RewriterTone = "as-is"
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
      });
      const modelSession = await createSession();

      const [proofread, rewritten, completion] = await Promise.all([
        proofreader?.proofread(text, { signal }),
        rewriter?.rewrite(text, { signal }),
        modelSession?.prompt(text, { signal }),
      ]);

      if (signal.aborted) {
        return;
      }

      const suggestions = [
        proofread?.correctedInput || "",
        rewritten || "",
        completion || "",
      ];

      const uniqueSuggestions = Array.from(new Set(suggestions)).filter(
        (s) => s && !s.match(/\b[A-Z]+_[A-Z]+\b/)
      );

      setSuggestions(uniqueSuggestions);
    } catch (err) {
      if ((err as DOMException).name === "AbortError") {
        return;
      }
      console.error("generateSuggestions failed:", err);
    }
  }

  useEffect(() => {
    const text = message.map((part) => part.label).join(" ");
    generateSuggestions(text, tone);

    return () => abortRef.current?.abort();
  }, [message, tone, board]);

  return {
    suggestions,
    generateSuggestions,
    suggestionTone: tone,
    setSuggestionTone: setTone,
  };
}
