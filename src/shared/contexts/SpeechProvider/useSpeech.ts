import { use } from "react";
import { SpeechContext, type SpeechContextType } from "./SpeechContext";

export function useSpeech(): SpeechContextType {
  const speech = use(SpeechContext);

  if (speech === undefined) {
    throw new Error("useSpeech must be used within a SpeechProvider");
  }

  return speech;
}
