import { useEffect } from "react";
import {
  getSpeechConfig,
  setVoiceURI,
  useVoicesByLanguage,
} from "./speech-store";

export interface UseVoiceLanguageSyncOptions {
  language: string;
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

    const fallbackVoice = voices.find((voice) => voice.default) ?? voices[0];
    if (fallbackVoice) {
      setVoiceURI(fallbackVoice.voiceURI);
    }
  }, [language, voicesByLanguage]);
}
