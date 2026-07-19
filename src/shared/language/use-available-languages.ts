import { locales } from "@paraglide/runtime";
import { useVoicesByLanguage } from "@shared/speech/speech-store";
import { getNativeLanguageName } from "@shared/utils/locale";

export function useAvailableLanguages() {
  const voicesByLanguage = useVoicesByLanguage();
  const languages = new Set([...locales, ...Object.keys(voicesByLanguage)]);

  return [...languages]
    .sort((a, b) => a.localeCompare(b))
    .map((code) => ({
      code,
      name: getNativeLanguageName(code),
    }));
}
