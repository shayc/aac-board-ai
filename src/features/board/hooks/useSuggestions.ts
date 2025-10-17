import { useProofreader } from "@/shared/hooks/ai/useProofreader";
import { useState } from "react";
import type { MessagePart } from "./useMessage";

export function useSuggestions() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [tone, setTone] = useState<string>("");

  const { createProofreader } = useProofreader();

  async function generateSuggestions(message: MessagePart[]) {
    const proofreader = await createProofreader();

    if (!proofreader) {
      return;
    }

    const text = message.map((part) => part.label).join(" ");
    const { correctedInput } = await proofreader.proofread(text);

    setSuggestions([correctedInput].filter((s) => !s.includes("GIVEN_TEXT")));
  }

  return {
    suggestions,
    generateSuggestions,
    suggestionTone: tone,
    setSuggestionTone: setTone,
  };
}
