import { createExternalStore } from "@shared/state/external-store";
import { getLanguageCode } from "@shared/language/locale";
import { createPersistedStore } from "@shared/state/persisted-store";
import {
  parseClampedNumber,
  type ClampedNumberOptions,
} from "@shared/utils/parse-clamped-number";
import { useSyncExternalStore } from "react";
import { getSpeechSynthesis } from "./speech-synthesis";

interface SpeechConfig {
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

export const SPEECH_RATE: ClampedNumberOptions = {
  min: 0.1,
  max: 2,
  fallback: 1,
};
export const SPEECH_PITCH: ClampedNumberOptions = {
  min: 0.1,
  max: 2,
  fallback: 1,
};
export const SPEECH_VOLUME: ClampedNumberOptions = {
  min: 0,
  max: 1,
  fallback: 1,
};

export function parseSpeechConfig(raw: unknown): SpeechConfig {
  const parsed = (raw ?? {}) as Record<string, unknown>;

  return {
    voiceURI: typeof parsed.voiceURI === "string" ? parsed.voiceURI : null,
    rate: parseClampedNumber(parsed.rate, SPEECH_RATE),
    pitch: parseClampedNumber(parsed.pitch, SPEECH_PITCH),
    volume: parseClampedNumber(parsed.volume, SPEECH_VOLUME),
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

const synthesis = getSpeechSynthesis();

const voiceCatalogStore = createExternalStore<VoiceCatalogState>(
  buildVoiceCatalog(synthesis?.getVoices() ?? []),
);

synthesis?.addEventListener("voiceschanged", () => {
  voiceCatalogStore.setState(buildVoiceCatalog(synthesis.getVoices()));
});

const speechConfigStore = createPersistedStore<SpeechConfig>(
  "speech-config",
  parseSpeechConfig,
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

export function getVoices(): SpeechSynthesisVoice[] {
  return voiceCatalogStore.getSnapshot().voices;
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
