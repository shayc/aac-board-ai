import type { ReactNode } from "react";

export interface SpeechProviderProps {
  children: ReactNode;
}

export function SpeechProvider({ children }: SpeechProviderProps) {
  return <>{children}</>;
}
