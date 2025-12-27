import { use } from "react";
import { SpeechContext, type SpeechContextValue } from "./SpeechContext";

export function useSpeech(): SpeechContextValue {
  const context = use(SpeechContext);

  if (!context) {
    throw new Error("useSpeech must be used within SpeechProvider");
  }

  return context;
}
