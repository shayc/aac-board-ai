import { useSpeech } from "@/shared/contexts/SpeechProvider/SpeechProvider";
import { useState } from "react";

export interface MessagePart {
  id: string;
  label: string;
  image?: string;
  vocalization?: string;
}

export function useMessage() {
  const [parts, setParts] = useState<MessagePart[]>([]);
  const speech = useSpeech();

  const appendPart = (part: MessagePart) => {
    setParts((prev) => [...prev, part]);
  };

  const popPart = () => {
    setParts((prev) => prev.slice(0, -1));
  };

  const clear = () => {
    setParts([]);
  };

  const play = () => {
    speech.speak(parts.map((t) => t.vocalization ?? t.label).join(" "));
  };

  return {
    parts,
    appendPart,
    popPart,
    clear,
    play,
  };
}
