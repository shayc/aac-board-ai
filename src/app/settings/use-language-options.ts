import { locales } from "@paraglide/runtime";
import { getNativeLanguageName } from "@shared/language/locale";
import { useVoicesByLanguage } from "@shared/speech/speech-store";

export function useLanguageOptions() {
  const voicesByLanguage = useVoicesByLanguage();
  const languages = new Set([...locales, ...Object.keys(voicesByLanguage)]);

  return [...languages]
    .sort((a, b) => a.localeCompare(b))
    .map((code) => ({
      code,
      name: getNativeLanguageName(code),
    }));
}
