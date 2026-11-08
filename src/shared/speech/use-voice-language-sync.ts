import {
  getLanguageCode,
  getLikelyRegionCode,
  getRegionCode,
} from "@shared/language/locale";
import { useEffect } from "react";
import {
  getSpeechPreferences,
  setSpeechVoiceURI,
  useVoicesByLanguage,
} from "./speech-store";

function getPreferredRegionCode(language: string): string | undefined {
  for (const tag of navigator.languages) {
    if (getLanguageCode(tag) !== language) {
      continue;
    }

    const region = getRegionCode(tag);
    if (region) {
      return region;
    }
  }

  return undefined;
}

export function useVoiceLanguageSync(language: string): void {
  const voicesByLanguage = useVoicesByLanguage();

  useEffect(() => {
    const voices = voicesByLanguage[language];
    if (!voices) {
      return;
    }

    const { voiceURI } = getSpeechPreferences();
    const hasMatchingVoice = voices.some(
      (voice) => voice.voiceURI === voiceURI,
    );
    if (hasMatchingVoice) {
      return;
    }

    const preferredRegionCode =
      getPreferredRegionCode(language) ?? getLikelyRegionCode(language);
    const regionVoices = voices.filter(
      (voice) => getRegionCode(voice.lang) === preferredRegionCode,
    );
    const candidates = regionVoices.length > 0 ? regionVoices : voices;

    const fallbackVoice =
      candidates.find((voice) => voice.default) ?? candidates[0];
    if (fallbackVoice) {
      setSpeechVoiceURI(fallbackVoice.voiceURI);
    }
  }, [language, voicesByLanguage]);
}
