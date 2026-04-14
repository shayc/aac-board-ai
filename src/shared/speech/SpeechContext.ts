import { createContext } from "react";
import type { UseSpeechSynthesisReturn } from "./useSpeechSynthesis";

export type SpeechContextValue = UseSpeechSynthesisReturn;

export const SpeechContext = createContext<SpeechContextValue | null>(null);
