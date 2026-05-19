import { getPrimaryLanguage } from "@shared/language/locale";
import { useSyncExternalStore } from "react";

export const RATE_MIN = 0.1;
export const RATE_MAX = 2;
const RATE_DEFAULT = 1;

export const PITCH_MIN = 0.1;
export const PITCH_MAX = 2;
const PITCH_DEFAULT = 1;

export const VOLUME_MIN = 0;
export const VOLUME_MAX = 1;
const VOLUME_DEFAULT = 1;

export const isSpeechSupported = "speechSynthesis" in globalThis;
const synthesis = isSpeechSupported ? globalThis.speechSynthesis : null;

export interface VoicesView {
  voices: SpeechSynthesisVoice[];
  locales: string[];
  voicesByLanguage: Partial<Record<string, SpeechSynthesisVoice[]>>;
  voicesByLocale: Partial<Record<string, SpeechSynthesisVoice[]>>;
}

interface SpeechSnapshot {
  voicesView: VoicesView;
  voiceURI: string;
  rate: number;
  pitch: number;
  volume: number;
}

function buildVoicesView(voices: SpeechSynthesisVoice[]): VoicesView {
  return {
    voices,
    locales: Array.from(new Set(voices.map((voice) => voice.lang))).sort(
      (a, b) => a.localeCompare(b),
    ),
    voicesByLanguage: Object.groupBy(voices, (voice) =>
      getPrimaryLanguage(voice.lang),
    ),
    voicesByLocale: Object.groupBy(voices, (voice) => voice.lang),
  };
}

const initialSnapshot: SpeechSnapshot = {
  voicesView: buildVoicesView(synthesis?.getVoices() ?? []),
  voiceURI: "",
  rate: RATE_DEFAULT,
  pitch: PITCH_DEFAULT,
  volume: VOLUME_DEFAULT,
};

let snapshot: SpeechSnapshot = initialSnapshot;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): SpeechSnapshot {
  return snapshot;
}

synthesis?.addEventListener("voiceschanged", () => {
  snapshot = {
    ...snapshot,
    voicesView: buildVoicesView(synthesis.getVoices()),
  };
  emit();
});

export function setVoiceURI(voiceURI: string): void {
  if (snapshot.voiceURI === voiceURI) {
    return;
  }
  snapshot = { ...snapshot, voiceURI };
  emit();
}

export function setRate(rate: number): void {
  if (snapshot.rate === rate) {
    return;
  }
  snapshot = { ...snapshot, rate };
  emit();
}

export function setPitch(pitch: number): void {
  if (snapshot.pitch === pitch) {
    return;
  }
  snapshot = { ...snapshot, pitch };
  emit();
}

export function setVolume(volume: number): void {
  if (snapshot.volume === volume) {
    return;
  }
  snapshot = { ...snapshot, volume };
  emit();
}

export function speak(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!synthesis) {
      reject(new Error("Speech Synthesis is not supported in this browser."));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = snapshot.voicesView.voices.find(
      (voice) => voice.voiceURI === snapshot.voiceURI,
    );

    utterance.voice = selectedVoice ?? null;
    utterance.pitch = snapshot.pitch;
    utterance.rate = snapshot.rate;
    utterance.volume = snapshot.volume;

    utterance.onend = () => {
      resolve();
    };

    utterance.onerror = (event) => {
      reject(new Error(event.error));
    };

    synthesis.cancel();
    synthesis.speak(utterance);
  });
}

export function cancel(): void {
  synthesis?.cancel();
}

export function pause(): void {
  synthesis?.pause();
}

export function resume(): void {
  synthesis?.resume();
}

export function useVoices(): VoicesView {
  return useSyncExternalStore(subscribe, () => getSnapshot().voicesView);
}

export function useVoiceURI(): string {
  return useSyncExternalStore(subscribe, () => getSnapshot().voiceURI);
}

export function useRate(): number {
  return useSyncExternalStore(subscribe, () => getSnapshot().rate);
}

export function usePitch(): number {
  return useSyncExternalStore(subscribe, () => getSnapshot().pitch);
}

export function useVolume(): number {
  return useSyncExternalStore(subscribe, () => getSnapshot().volume);
}

export function __resetSpeechStoreForTests(): void {
  snapshot = {
    ...snapshot,
    voiceURI: "",
    rate: RATE_DEFAULT,
    pitch: PITCH_DEFAULT,
    volume: VOLUME_DEFAULT,
  };
  emit();
}
