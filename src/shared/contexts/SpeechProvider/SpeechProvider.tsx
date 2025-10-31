import { type ReactNode } from "react";
import { SpeechContext } from "./SpeechContext";
import { useSpeechSynthesis } from "./useSpeechSynthesis";

export interface SpeechProviderProps {
  children: ReactNode;
}

export function SpeechProvider({ children }: SpeechProviderProps) {
  const speech = useSpeechSynthesis();

  return <SpeechContext value={speech}>{children}</SpeechContext>;
}
