export interface SpeechText {
  text: string;
  language: string;
}

export interface SpeechParameters {
  voice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  volume: number;
}

export function getSpeechSynthesis(): SpeechSynthesis | undefined {
  return globalThis.speechSynthesis;
}
