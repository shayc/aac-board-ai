import { getStoredLanguage } from "@shared/language/language-store";
import { getLanguageCode } from "@shared/language/locale";
import { useLanguage } from "@shared/language/use-language";
import {
  createExternalStore,
  useExternalStore,
} from "@shared/state/external-store";
import { createPersistedStore } from "@shared/state/persisted-store";
import { isRecord } from "@shared/utils/is-record";
import {
  parseClampedNumber,
  type NumberRange,
} from "@shared/utils/parse-clamped-number";
import { resolveVoice } from "./resolve-voice";
import { getSpeechSynthesis, type SpeechParameters } from "./speech-synthesis";

interface SpeechPreferences {
  voiceURI: string | null;
  rate: number;
  pitch: number;
  volume: number;
}

export type VoicesByLanguage = Partial<
  Record<string, readonly SpeechSynthesisVoice[]>
>;

export const SPEECH_RATE_RANGE: NumberRange = {
  min: 0.1,
  max: 2,
  defaultValue: 1,
};
export const SPEECH_PITCH_RANGE: NumberRange = {
  min: 0.1,
  max: 2,
  defaultValue: 1,
};
export const SPEECH_VOLUME_RANGE: NumberRange = {
  min: 0.1,
  max: 1,
  defaultValue: 1,
};

export function parseSpeechPreferences(raw: unknown): SpeechPreferences {
  const stored: Record<string, unknown> = isRecord(raw) ? raw : {};

  return {
    voiceURI: typeof stored.voiceURI === "string" ? stored.voiceURI : null,
    rate: parseClampedNumber(stored.rate, SPEECH_RATE_RANGE),
    pitch: parseClampedNumber(stored.pitch, SPEECH_PITCH_RANGE),
    volume: parseClampedNumber(stored.volume, SPEECH_VOLUME_RANGE),
  };
}

function groupVoicesByLanguage(
  voices: readonly SpeechSynthesisVoice[],
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

export function useVoicesByLanguage(): VoicesByLanguage {
  return useExternalStore(voicesByLanguageStore);
}

export function useSpeechPreferences(): SpeechPreferences {
  return useExternalStore(speechPreferencesStore);
}

export function getSpeechParameters(): SpeechParameters {
  const language = getStoredLanguage();
  const voicesByLanguage = voicesByLanguageStore.getSnapshot();
  const { voiceURI, rate, pitch, volume } =
    speechPreferencesStore.getSnapshot();

  return {
    language,
    voice: resolveVoice(voicesByLanguage, language, voiceURI),
    rate,
    pitch,
    volume,
  };
}

export function useSpeechVoice(): SpeechSynthesisVoice | null {
  const voicesByLanguage = useVoicesByLanguage();
  const { language } = useLanguage();
  const { voiceURI } = useSpeechPreferences();

  return resolveVoice(voicesByLanguage, language, voiceURI);
}
