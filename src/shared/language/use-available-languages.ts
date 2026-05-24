import { useVoicesByLanguage } from "@shared/speech/speech-store";
import { getNativeLanguageName } from "@shared/utils/locale";

// Chrome's Translator API can't handle these, so the picker hides them.
const UNTRANSLATABLE_LANGUAGES = new Set(["ca", "ms", "nb", "yue"]);

export function useAvailableLanguages() {
  const voicesByLanguage = useVoicesByLanguage();

  return Object.keys(voicesByLanguage)
    .filter((code) => !UNTRANSLATABLE_LANGUAGES.has(code))
    .sort((a, b) => a.localeCompare(b))
    .map((code) => ({
      language: code,
      name: getNativeLanguageName(code),
    }));
}
