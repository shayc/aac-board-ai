import { createContext } from "react";

export interface SpeechContextValue {
  langs: string[];
  voicesByLang: Partial<Record<string, SpeechSynthesisVoice[]>>;
  voicesByLocale: Partial<Record<string, SpeechSynthesisVoice[]>>;
  voices: SpeechSynthesisVoice[];
  voiceURI: string;
  setVoiceURI: (voiceURI: string) => void;
  pitch: number;
  setPitch: (pitch: number) => void;
  rate: number;
  setRate: (rate: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
  speak: (text: string) => Promise<void>;
  cancel: () => void;
  isSpeechSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
}

export const SpeechContext = createContext<SpeechContextValue | null>(null);
