import { use } from "react";
import { SpeechContext, type SpeechContextType } from "./SpeechContext";

export function useSpeech(): SpeechContextType {
  const context = use(SpeechContext);

  if (!context) {
    throw new Error("useSpeech must be used within a SpeechProvider");
  }

  return context;
}
