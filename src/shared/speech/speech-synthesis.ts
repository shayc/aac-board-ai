export interface SpeechParameters {
  language: string;
  voice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  volume: number;
}

export function getSpeechSynthesis(): SpeechSynthesis | undefined {
  return globalThis.speechSynthesis;
}
