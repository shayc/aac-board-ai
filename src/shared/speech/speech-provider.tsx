import { type ReactNode } from "react";
import { SpeechContext } from "./speech-context";
import { useSpeechSynthesis } from "./use-speech-synthesis";

export interface SpeechProviderProps {
  children: ReactNode;
}

export function SpeechProvider({ children }: SpeechProviderProps) {
  const speech = useSpeechSynthesis();

  return <SpeechContext value={speech}>{children}</SpeechContext>;
}
