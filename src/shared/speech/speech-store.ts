import { createExternalStore } from "@shared/state/external-store";
import { getLanguageCode } from "@shared/language/locale";
import { createPersistedStore } from "@shared/state/persisted-store";
import {
  parseClampedNumber,
  type ClampedNumberOptions,
} from "@shared/utils/parse-clamped-number";
import { useSyncExternalStore } from "react";
import { getSpeechSynthesis } from "./speech-synthesis";

interface SpeechPreferences {
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
  defaultValue: 1,
};
export const SPEECH_PITCH: ClampedNumberOptions = {
  min: 0.1,
  max: 2,
  defaultValue: 1,
};
export const SPEECH_VOLUME: ClampedNumberOptions = {
  min: 0.1,
  max: 1,
  defaultValue: 1,
};

export function parseSpeechPreferences(raw: unknown): SpeechPreferences {
  const stored = (raw ?? {}) as Record<string, unknown>;

  return {
    voiceURI: typeof stored.voiceURI === "string" ? stored.voiceURI : null,
    rate: parseClampedNumber(stored.rate, SPEECH_RATE),
    pitch: parseClampedNumber(stored.pitch, SPEECH_PITCH),
    volume: parseClampedNumber(stored.volume, SPEECH_VOLUME),
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

const speechPreferencesStore = createPersistedStore<SpeechPreferences>(
  "speech-preferences",
  parseSpeechPreferences,
);

function updatePreferences(patch: Partial<SpeechPreferences>): void {
  speechPreferencesStore.setState({
    ...speechPreferencesStore.getSnapshot(),
    ...patch,
  });
}

export function getSpeechPreferences(): SpeechPreferences {
  return speechPreferencesStore.getSnapshot();
}

export function setSpeechVoiceURI(voiceURI: string | null): void {
  updatePreferences({ voiceURI });
}

export function setSpeechRate(rate: number): void {
  updatePreferences({ rate });
}

export function setSpeechPitch(pitch: number): void {
  updatePreferences({ pitch });
}

export function setSpeechVolume(volume: number): void {
  updatePreferences({ volume });
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

export function useSpeechPreferences(): SpeechPreferences {
  return useSyncExternalStore(
    speechPreferencesStore.subscribe,
    speechPreferencesStore.getSnapshot,
  );
}
