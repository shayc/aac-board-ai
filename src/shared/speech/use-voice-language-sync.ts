import {
  getLanguageCode,
  getLikelyRegion,
  getRegionCode,
} from "@shared/utils/locale";
import { useEffect } from "react";
import {
  getSpeechConfig,
  setVoiceURI,
  useVoicesByLanguage,
} from "./speech-store";

export interface UseVoiceLanguageSyncOptions {
  language: string;
}

/**
 * The user's own region for a language, drawn from OS/browser preferences
 * (e.g. a Canadian's "fr-CA" → "CA").
 */
function getUserRegionForLanguage(language: string): string | undefined {
  for (const tag of navigator.languages) {
    if (getLanguageCode(tag) === language) {
      const region = getRegionCode(tag);
      if (region) {
        return region;
      }
    }
  }

  return undefined;
}

export function useVoiceLanguageSync({
  language,
}: UseVoiceLanguageSyncOptions): void {
  const voicesByLanguage = useVoicesByLanguage();

  useEffect(() => {
    const voices = voicesByLanguage[language];
    if (!voices) {
      return;
    }

    const { voiceURI } = getSpeechConfig();
    const hasMatchingVoice = voices.some(
      (voice) => voice.voiceURI === voiceURI,
    );
    if (hasMatchingVoice) {
      return;
    }

    const preferredRegion =
      getUserRegionForLanguage(language) ?? getLikelyRegion(language);
    const regionVoices = voices.filter(
      (voice) => getRegionCode(voice.lang) === preferredRegion,
    );
    const candidates = regionVoices.length > 0 ? regionVoices : voices;

    const fallbackVoice =
      candidates.find((voice) => voice.default) ?? candidates[0];
    if (fallbackVoice) {
      setVoiceURI(fallbackVoice.voiceURI);
    }
  }, [language, voicesByLanguage]);
}
