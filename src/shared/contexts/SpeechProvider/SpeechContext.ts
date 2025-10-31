import { createContext } from "react";

export interface SpeechContextType {
  langs: string[];
  voicesByLang: Record<string, SpeechSynthesisVoice[]>;
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
  isSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
}

export const SpeechContext = createContext<SpeechContextType | undefined>(undefined);
