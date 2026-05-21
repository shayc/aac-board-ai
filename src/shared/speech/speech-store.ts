// Speech is a singleton over the Web Speech API with two facets — a platform-
// provided voice catalog and a user-tunable configuration — plus imperative
// speak/stop actions. Subscribe via hooks; mutate via module functions.
// Module-level setters are stable by construction; no memoization needed.

import { getPrimaryLanguage } from "@shared/language/locale";
import { createExternalStore } from "@shared/utils/external-store";
import { useSyncExternalStore } from "react";

export const SPEECH_RATE_MIN = 0.1;
export const SPEECH_RATE_MAX = 2;
export const SPEECH_RATE_DEFAULT = 1;

export const SPEECH_PITCH_MIN = 0.1;
export const SPEECH_PITCH_MAX = 2;
export const SPEECH_PITCH_DEFAULT = 1;

export const SPEECH_VOLUME_MIN = 0;
export const SPEECH_VOLUME_MAX = 1;
export const SPEECH_VOLUME_DEFAULT = 1;

export const isSpeechSupported = "speechSynthesis" in globalThis;
const synthesis = globalThis.speechSynthesis;

export interface VoiceCatalog {
  voices: SpeechSynthesisVoice[];
  voicesByLanguage: Partial<Record<string, SpeechSynthesisVoice[]>>;
  voicesByLocale: Partial<Record<string, SpeechSynthesisVoice[]>>;
  locales: string[];
}

export interface SpeechConfig {
  voiceURI: string | null;
  rate: number;
  pitch: number;
  volume: number;
}

function buildVoiceCatalog(voices: SpeechSynthesisVoice[]): VoiceCatalog {
  return {
    voices,
    voicesByLanguage: Object.groupBy(voices, (voice) =>
      getPrimaryLanguage(voice.lang),
    ),
    voicesByLocale: Object.groupBy(voices, (voice) => voice.lang),
    locales: Array.from(new Set(voices.map((voice) => voice.lang))).sort(
      (a, b) => a.localeCompare(b),
    ),
  };
}

const voiceCatalogStore = createExternalStore<VoiceCatalog>(
  buildVoiceCatalog(isSpeechSupported ? synthesis.getVoices() : []),
);

const speechConfigStore = createExternalStore<SpeechConfig>({
  voiceURI: null,
  rate: SPEECH_RATE_DEFAULT,
  pitch: SPEECH_PITCH_DEFAULT,
  volume: SPEECH_VOLUME_DEFAULT,
});

if (isSpeechSupported) {
  synthesis.addEventListener("voiceschanged", () => {
    voiceCatalogStore.setState(buildVoiceCatalog(synthesis.getVoices()));
  });
}

function updateConfig(patch: Partial<SpeechConfig>): void {
  speechConfigStore.setState({ ...speechConfigStore.getSnapshot(), ...patch });
}

export function setVoiceURI(voiceURI: string | null): void {
  updateConfig({ voiceURI });
}

export function setSpeechRate(rate: number): void {
  updateConfig({ rate });
}

export function setSpeechPitch(pitch: number): void {
  updateConfig({ pitch });
}

export function setSpeechVolume(volume: number): void {
  updateConfig({ volume });
}

export function speak(text: string): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>();

  if (!isSpeechSupported) {
    reject(new Error("Speech synthesis is not supported in this browser."));
    return promise;
  }

  const { voices } = voiceCatalogStore.getSnapshot();
  const { voiceURI, pitch, rate, volume } = speechConfigStore.getSnapshot();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voices.find((voice) => voice.voiceURI === voiceURI) ?? null;
  utterance.pitch = pitch;
  utterance.rate = rate;
  utterance.volume = volume;

  utterance.onend = () => resolve();
  utterance.onerror = (event) => reject(new Error(event.error));

  synthesis.cancel();
  synthesis.speak(utterance);

  return promise;
}

export function stopSpeaking(): void {
  if (isSpeechSupported) {
    synthesis.cancel();
  }
}

export function useVoiceCatalog(): VoiceCatalog {
  return useSyncExternalStore(
    voiceCatalogStore.subscribe,
    voiceCatalogStore.getSnapshot,
  );
}

export function useSpeechConfig(): SpeechConfig {
  return useSyncExternalStore(
    speechConfigStore.subscribe,
    speechConfigStore.getSnapshot,
  );
}
