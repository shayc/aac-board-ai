import { createContext } from "react";
import type { UseSpeechSynthesisReturn } from "./use-speech-synthesis";

export type SpeechContextValue = UseSpeechSynthesisReturn;

export const SpeechContext = createContext<SpeechContextValue | null>(null);
