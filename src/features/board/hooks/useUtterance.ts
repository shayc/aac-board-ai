import { useSpeech } from "@/shared/contexts/SpeechProvider/SpeechProvider";
import { useState } from "react";

export interface UtteranceToken {
  id: string;
  label: string;
  image?: string;
  vocalization?: string;
}

export function useUtterance() {
  const [tokens, setTokens] = useState<UtteranceToken[]>([]);
  const speech = useSpeech();

  const appendToken = (token: UtteranceToken) => {
    setTokens((prev) => [...prev, token]);
  };

  const popToken = () => {
    setTokens((prev) => prev.slice(0, -1));
  };

  const clear = () => {
    setTokens([]);
  };

  const play = () => {
    speech.speak(tokens.map((t) => t.vocalization ?? t.label).join(" "));
  };

  return {
    tokens,
    appendToken,
    popToken,
    clear,
    play,
  };
}
