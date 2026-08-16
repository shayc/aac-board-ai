export function getSpeechSynthesis(): SpeechSynthesis | undefined {
  return globalThis.speechSynthesis;
}
