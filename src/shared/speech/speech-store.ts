import { getStoredLanguage } from "@shared/language/language-store";
import { getLanguageCode } from "@shared/language/locale";
import { useCommunicationLanguage } from "@shared/language/use-communication-language";
import {
  createExternalStore,
  patchState,
  useExternalStore,
} from "@shared/state/external-store";
import { createPersistedStore } from "@shared/state/persisted-store";
import { isRecord } from "@shared/utils/is-record";
import {
  type ClampedNumberOptions,
  parseClampedNumber,
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
  const stored: Record<string, unknown> = isRecord(raw) ? raw : {};

  return {
    voiceURI: typeof stored.voiceURI === "string" ? stored.voiceURI : null,
    rate: parseClampedNumber(stored.rate, SPEECH_RATE),
    pitch: parseClampedNumber(stored.pitch, SPEECH_PITCH),
    volume: parseClampedNumber(stored.volume, SPEECH_VOLUME),
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

export function setSpeechVoiceURI(voiceURI: string | null): void {
  patchState(speechPreferencesStore, { voiceURI });
}

export function setSpeechRate(rate: number): void {
  patchState(speechPreferencesStore, { rate });
}

export function setSpeechPitch(pitch: number): void {
  patchState(speechPreferencesStore, { pitch });
}

export function setSpeechVolume(volume: number): void {
  patchState(speechPreferencesStore, { volume });
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
  const { language } = useCommunicationLanguage();
  const { voiceURI } = useSpeechPreferences();

  return resolveVoice(voicesByLanguage, language, voiceURI);
}
