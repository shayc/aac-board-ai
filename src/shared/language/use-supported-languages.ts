import { isSupportedLanguage } from "@shared/built-in-ai/translator/is-supported-language";
import { useVoicesByLanguage } from "@shared/speech/speech-store";
import { getNativeLanguageName } from "@shared/utils/locale";

export function useSupportedLanguages() {
  const voicesByLanguage = useVoicesByLanguage();

  return Object.keys(voicesByLanguage)
    .filter(isSupportedLanguage)
    .sort((a, b) => a.localeCompare(b))
    .map((code) => ({
      language: code,
      name: getNativeLanguageName(code),
    }));
}
