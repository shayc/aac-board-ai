import { createExternalStore } from "@shared/utils/external-store";
import { getLanguageCode } from "@shared/utils/locale";
import { useSyncExternalStore } from "react";

export interface SpeechRange {
  min: number;
  max: number;
  fallback: number;
}

export interface SpeechConfig {
  voiceURI: string | null;
  rate: number;
  pitch: number;
  volume: number;
}

type VoicesByLanguage = Partial<Record<string, SpeechSynthesisVoice[]>>;

interface VoiceCatalogState {
  voices: SpeechSynthesisVoice[];
  voicesByLanguage: VoicesByLanguage;
}

export const SPEECH_RATE: SpeechRange = { min: 0.1, max: 2, fallback: 1 };
export const SPEECH_PITCH: SpeechRange = { min: 0.1, max: 2, fallback: 1 };
export const SPEECH_VOLUME: SpeechRange = { min: 0, max: 1, fallback: 1 };

const STORAGE_KEY = "speech-config";

const DEFAULT_CONFIG: SpeechConfig = {
  voiceURI: null,
  rate: SPEECH_RATE.fallback,
  pitch: SPEECH_PITCH.fallback,
  volume: SPEECH_VOLUME.fallback,
};

function clamp(value: unknown, { min, max, fallback }: SpeechRange): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(Math.max(value, min), max)
    : fallback;
}

function loadPersistedConfig(): SpeechConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_CONFIG;
    }

    const parsed = JSON.parse(raw) as Partial<SpeechConfig>;

    return {
      voiceURI: typeof parsed.voiceURI === "string" ? parsed.voiceURI : null,
      rate: clamp(parsed.rate, SPEECH_RATE),
      pitch: clamp(parsed.pitch, SPEECH_PITCH),
      volume: clamp(parsed.volume, SPEECH_VOLUME),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function buildVoiceCatalog(voices: SpeechSynthesisVoice[]): VoiceCatalogState {
  return {
    voices,
    voicesByLanguage: Object.groupBy(voices, (voice) =>
      getLanguageCode(voice.lang),
    ),
  };
}

const synthesis: SpeechSynthesis | undefined = globalThis.speechSynthesis;

const voiceCatalogStore = createExternalStore<VoiceCatalogState>(
  buildVoiceCatalog(synthesis?.getVoices() ?? []),
);

synthesis?.addEventListener("voiceschanged", () => {
  voiceCatalogStore.setState(buildVoiceCatalog(synthesis.getVoices()));
});

const speechConfigStore = createExternalStore<SpeechConfig>(
  loadPersistedConfig(),
);

speechConfigStore.subscribe(() => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(speechConfigStore.getSnapshot()),
    );
  } catch {
    // Storage failures (quota, private mode) shouldn't break the in-memory store.
  }
});

function updateConfig(patch: Partial<SpeechConfig>): void {
  speechConfigStore.setState({ ...speechConfigStore.getSnapshot(), ...patch });
}

export function getSpeechConfig(): SpeechConfig {
  return speechConfigStore.getSnapshot();
}

export function setVoiceURI(voiceURI: string | null): void {
  updateConfig({ voiceURI });
}

export function setRate(rate: number): void {
  updateConfig({ rate });
}

export function setPitch(pitch: number): void {
  updateConfig({ pitch });
}

export function setVolume(volume: number): void {
  updateConfig({ volume });
}

export function speak(text: string): Promise<void> {
  if (!synthesis) {
    return Promise.resolve();
  }

  const { promise, resolve, reject } = Promise.withResolvers<void>();

  const { voices } = voiceCatalogStore.getSnapshot();
  const { voiceURI, rate, pitch, volume } = speechConfigStore.getSnapshot();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voices.find((voice) => voice.voiceURI === voiceURI) ?? null;
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;

  utterance.onend = () => resolve();
  utterance.onerror = (event) => {
    // Each speak() and stop() calls synthesis.cancel(), so "interrupted" is the
    // expected end of a superseded utterance — resolve it rather than reject.
    if (event.error === "interrupted") {
      resolve();
    } else {
      reject(new Error(event.error));
    }
  };

  synthesis.cancel();
  synthesis.speak(utterance);

  return promise;
}

export function stop(): void {
  synthesis?.cancel();
}

export function useVoicesByLanguage(): VoicesByLanguage {
  return useSyncExternalStore(
    voiceCatalogStore.subscribe,
    () => voiceCatalogStore.getSnapshot().voicesByLanguage,
  );
}

export function useSpeechConfig(): SpeechConfig {
  return useSyncExternalStore(
    speechConfigStore.subscribe,
    speechConfigStore.getSnapshot,
  );
}
