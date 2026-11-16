export interface SpeechText {
  text: string;
  /** The language the text is in, which picks the voice that speaks it. */
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
