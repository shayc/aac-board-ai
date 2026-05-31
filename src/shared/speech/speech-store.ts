import { createPersistedStore } from "@shared/utils/persisted-store";
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

export interface SpeakOptions {
  signal?: AbortSignal;
  onBoundary?: (charIndex: number) => void;
}

type VoicesByLanguage = Partial<Record<string, SpeechSynthesisVoice[]>>;

interface VoiceCatalogState {
  voices: SpeechSynthesisVoice[];
  voicesByLanguage: VoicesByLanguage;
}

export const SPEECH_RATE: SpeechRange = { min: 0.1, max: 2, fallback: 1 };
export const SPEECH_PITCH: SpeechRange = { min: 0.1, max: 2, fallback: 1 };
export const SPEECH_VOLUME: SpeechRange = { min: 0, max: 1, fallback: 1 };

function clamp(value: unknown, { min, max, fallback }: SpeechRange): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(Math.max(value, min), max)
    : fallback;
}

function parseConfig(raw: unknown): SpeechConfig {
  const parsed = (raw ?? {}) as Partial<SpeechConfig>;

  return {
    voiceURI: typeof parsed.voiceURI === "string" ? parsed.voiceURI : null,
    rate: clamp(parsed.rate, SPEECH_RATE),
    pitch: clamp(parsed.pitch, SPEECH_PITCH),
    volume: clamp(parsed.volume, SPEECH_VOLUME),
  };
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

const speechConfigStore = createPersistedStore<SpeechConfig>(
  "speech-config",
  parseConfig,
);

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

function buildUtterance(text: string): SpeechSynthesisUtterance {
  const { voices } = voiceCatalogStore.getSnapshot();
  const { voiceURI, rate, pitch, volume } = speechConfigStore.getSnapshot();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voices.find((voice) => voice.voiceURI === voiceURI) ?? null;
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;

  return utterance;
}

export function speak(
  text: string,
  { signal, onBoundary }: SpeakOptions = {},
): Promise<void> {
  if (!synthesis || signal?.aborted) {
    return Promise.resolve();
  }

  const { promise, resolve, reject } = Promise.withResolvers<void>();
  const utterance = buildUtterance(text);

  if (onBoundary) {
    // A boundary can arrive after the signal aborts; drop it so a stopped
    // utterance can't keep reporting progress.
    utterance.onboundary = (event) => {
      if (!signal?.aborted) {
        onBoundary(event.charIndex);
      }
    };
  }

  utterance.onend = () => resolve();
  utterance.onerror = (event) => {
    // Aborting (and each new speak()) calls cancel(), so "interrupted" is the
    // expected end of a superseded utterance — resolve it rather than reject.
    if (event.error === "interrupted") {
      resolve();
    } else {
      reject(new Error(event.error));
    }
  };

  // Stopping is a clean end, not a failure: cancel the utterance and resolve.
  signal?.addEventListener(
    "abort",
    () => {
      synthesis.cancel();
      resolve();
    },
    { once: true },
  );

  synthesis.cancel();
  synthesis.speak(utterance);

  return promise;
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
