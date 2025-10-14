import { useSpeech } from "@/shared/contexts/SpeechProvider/SpeechProvider";
import { useAudio } from "@/shared/hooks/useAudio";
import { useState } from "react";

export interface MessagePart {
  id: string;
  label?: string;
  imageSrc?: string;
  soundSrc?: string;
  vocalization?: string;
}

export function useMessage() {
  const [parts, setParts] = useState<MessagePart[]>([]);
  const speech = useSpeech();
  const audio = useAudio();

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
    audio.play();
    speech.speak();
  };

  return {
    parts,
    appendPart,
    popPart,
    clear,
    play,
  };
}
