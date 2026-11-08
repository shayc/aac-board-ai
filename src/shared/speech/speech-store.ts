import { getLanguageCode } from "@shared/language/locale";
import {
  createExternalStore,
  useExternalStore,
} from "@shared/state/external-store";
import { createPersistedStore } from "@shared/state/persisted-store";
import {
  parseClampedNumber,
  type ClampedNumberOptions,
} from "@shared/utils/parse-clamped-number";
import { getSpeechSynthesis } from "./speech-synthesis";

interface SpeechPreferences {
  voiceURI: string | null;
  rate: number;
  pitch: number;
  volume: number;
}

type VoicesByLanguage = Partial<Record<string, SpeechSynthesisVoice[]>>;

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

function groupVoicesByLanguage(
  voices: SpeechSynthesisVoice[],
): VoicesByLanguage {
  return Object.groupBy(voices, (voice) => getLanguageCode(voice.lang));
}

const synthesis = getSpeechSynthesis();

const voicesByLanguageStore = createExternalStore<VoicesByLanguage>(
  groupVoicesByLanguage(synthesis?.getVoices() ?? []),
);

synthesis?.addEventListener("voiceschanged", () => {
  voicesByLanguageStore.setState(groupVoicesByLanguage(synthesis.getVoices()));
});

const speechPreferencesStore = createPersistedStore<SpeechPreferences>(
  "speech-preferences",
  parseSpeechPreferences,
);

function updatePreferences(patch: Partial<SpeechPreferences>): void {
  speechPreferencesStore.setState((preferences) => ({
    ...preferences,
    ...patch,
  }));
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

export function getVoicesByLanguage(): VoicesByLanguage {
  return voicesByLanguageStore.getSnapshot();
}

export function useVoicesByLanguage(): VoicesByLanguage {
  return useExternalStore(voicesByLanguageStore);
}

export function useSpeechPreferences(): SpeechPreferences {
  return useExternalStore(speechPreferencesStore);
}
