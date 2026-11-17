import { useCommunicationLanguage } from "@shared/language/language-store";
import { getLanguageCode } from "@shared/language/locale";
import {
  createExternalStore,
  patchState,
  useExternalStore,
} from "@shared/stores/external-store";
import { createPersistedStore } from "@shared/stores/persisted-store";
import { isRecord } from "@shared/utils/is-record";
import {
  type ClampedNumberOptions,
  parseClampedNumber,
} from "@shared/utils/parse-clamped-number";
import { resolveVoice, type VoicesByLanguage } from "./resolve-voice";
import { getSpeechSynthesis, type SpeechParameters } from "./speech-synthesis";

type VoiceURIsByLanguage = Partial<Record<string, string>>;

interface SpeechPreferences {
  voiceURIs: VoiceURIsByLanguage;
  rate: number;
  pitch: number;
  volume: number;
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
  const stored: Record<string, unknown> = isRecord(raw) ? raw : {};

  return {
    voiceURIs: parseVoiceURIs(stored.voiceURIs),
    rate: parseClampedNumber(stored.rate, SPEECH_RATE),
    pitch: parseClampedNumber(stored.pitch, SPEECH_PITCH),
    volume: parseClampedNumber(stored.volume, SPEECH_VOLUME),
  };
}

function parseVoiceURIs(raw: unknown): VoiceURIsByLanguage {
  if (!isRecord(raw)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(raw).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
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

export function setSpeechVoice(language: string, voiceURI: string): void {
  const { voiceURIs } = speechPreferencesStore.getSnapshot();

  patchState(speechPreferencesStore, {
    voiceURIs: { ...voiceURIs, [language]: voiceURI },
  });
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

// Saved voices come from storage as a plain object, so an own-key check keeps
// inherited members like `constructor` from reading as a saved voice.
function getSavedVoiceURI(
  voiceURIs: VoiceURIsByLanguage,
  language: string,
): string | undefined {
  return Object.hasOwn(voiceURIs, language) ? voiceURIs[language] : undefined;
}

// A voice reads any text as its own language, so the voice follows the
// language of the text rather than the communication language.
export function getSpeechParameters(language: string): SpeechParameters {
  const voicesByLanguage = voicesByLanguageStore.getSnapshot();
  const { voiceURIs, rate, pitch, volume } =
    speechPreferencesStore.getSnapshot();

  return {
    voice: resolveVoice(
      voicesByLanguage,
      language,
      getSavedVoiceURI(voiceURIs, language),
    ),
    rate,
    pitch,
    volume,
  };
}

export function useSpeechVoice(): SpeechSynthesisVoice | null {
  const voicesByLanguage = useVoicesByLanguage();
  const { language } = useCommunicationLanguage();
  const { voiceURIs } = useSpeechPreferences();

  return resolveVoice(
    voicesByLanguage,
    language,
    getSavedVoiceURI(voiceURIs, language),
  );
}
