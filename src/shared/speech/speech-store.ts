import { getLanguageCode } from "@shared/utils/locale";
import { createExternalStore } from "@shared/utils/external-store";
import { useSyncExternalStore } from "react";

export const SPEECH_RATE_MIN = 0.1;
export const SPEECH_RATE_MAX = 2;
const SPEECH_RATE_DEFAULT = 1;

export const SPEECH_PITCH_MIN = 0.1;
export const SPEECH_PITCH_MAX = 2;
const SPEECH_PITCH_DEFAULT = 1;

export const SPEECH_VOLUME_MIN = 0;
export const SPEECH_VOLUME_MAX = 1;
const SPEECH_VOLUME_DEFAULT = 1;

const STORAGE_KEY = "speech-config";

const synthesis: SpeechSynthesis | undefined = globalThis.speechSynthesis;

type VoicesByLanguage = Partial<Record<string, SpeechSynthesisVoice[]>>;

interface VoiceCatalogState {
  voices: SpeechSynthesisVoice[];
  voicesByLanguage: VoicesByLanguage;
}

export interface SpeechConfig {
  voiceURI: string | null;
  rate: number;
  pitch: number;
  volume: number;
}

const DEFAULT_CONFIG: SpeechConfig = {
  voiceURI: null,
  rate: SPEECH_RATE_DEFAULT,
  pitch: SPEECH_PITCH_DEFAULT,
  volume: SPEECH_VOLUME_DEFAULT,
};

function clamp(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
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
      rate: clamp(
        parsed.rate,
        SPEECH_RATE_MIN,
        SPEECH_RATE_MAX,
        SPEECH_RATE_DEFAULT,
      ),
      pitch: clamp(
        parsed.pitch,
        SPEECH_PITCH_MIN,
        SPEECH_PITCH_MAX,
        SPEECH_PITCH_DEFAULT,
      ),
      volume: clamp(
        parsed.volume,
        SPEECH_VOLUME_MIN,
        SPEECH_VOLUME_MAX,
        SPEECH_VOLUME_DEFAULT,
      ),
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

const voiceCatalogStore = createExternalStore<VoiceCatalogState>(
  buildVoiceCatalog(synthesis?.getVoices() ?? []),
);

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

let voiceLanguage: string | null = null;

synthesis?.addEventListener("voiceschanged", () => {
  voiceCatalogStore.setState(buildVoiceCatalog(synthesis.getVoices()));
  if (voiceLanguage && !currentVoiceIsValidFor(voiceLanguage)) {
    selectDefaultVoiceFor(voiceLanguage);
  }
});

function currentVoiceIsValidFor(language: string): boolean {
  const { voices } = voiceCatalogStore.getSnapshot();
  const { voiceURI } = speechConfigStore.getSnapshot();
  if (!voiceURI) {
    return false;
  }
  const match = voices.find((voice) => voice.voiceURI === voiceURI);
  if (!match) {
    return false;
  }
  return getLanguageCode(match.lang) === language;
}

function updateConfig(patch: Partial<SpeechConfig>): void {
  speechConfigStore.setState({ ...speechConfigStore.getSnapshot(), ...patch });
}

export function setVoiceURI(voiceURI: string | null): void {
  updateConfig({ voiceURI });
}

export function setVoiceLanguage(language: string): void {
  voiceLanguage = language;
  if (!currentVoiceIsValidFor(language)) {
    selectDefaultVoiceFor(language);
  }
}

function selectDefaultVoiceFor(language: string): void {
  const voices = voiceCatalogStore.getSnapshot().voicesByLanguage[language];
  const defaultVoice = voices?.find((voice) => voice.default) ?? voices?.[0];
  if (defaultVoice) {
    setVoiceURI(defaultVoice.voiceURI);
  }
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
