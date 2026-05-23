import { baseLocale, isLocale, setLocale } from "@paraglide/runtime";
import { usePersistentState } from "@shared/hooks/use-persistent-state";
import { setVoiceURI, useVoicesByLanguage } from "@shared/speech/speech-store";
import { getNativeLanguageName, getTextDirection } from "@shared/utils/locale";
import { useEffect, type ReactNode } from "react";
import { LanguageContext, type LanguageContextValue } from "./language-context";

export interface LanguageProviderProps {
  children: ReactNode;
}

const UNSUPPORTED_LANGUAGES: readonly string[] = ["ca", "ms", "nb", "yue"];

export function LanguageProvider({ children }: LanguageProviderProps) {
  const voicesByLanguage = useVoicesByLanguage();

  const [language, setLanguage] = usePersistentState<string>("language", "en");

  // Sync Paraglide *during render* (not in an effect) so children resolve the
  // right locale on first paint. Unsupported languages degrade to baseLocale,
  // keeping the UI in English while voice/board content follows the user's pick.
  void setLocale(isLocale(language) ? language : baseLocale, { reload: false });

  const languages = Object.keys(voicesByLanguage)
    .filter((language) => !UNSUPPORTED_LANGUAGES.includes(language))
    .sort((a, b) => a.localeCompare(b))
    .map((language) => ({
      language,
      name: getNativeLanguageName(language),
    }));

  const direction = getTextDirection(language);

  const contextValue: LanguageContextValue = {
    languages,
    language,
    setLanguage,
    direction,
  };

  useEffect(() => {
    const voices = voicesByLanguage[language];
    const defaultVoice = voices?.find((voice) => voice.default) ?? voices?.[0];
    if (defaultVoice) {
      setVoiceURI(defaultVoice.voiceURI);
    }
  }, [language, voicesByLanguage]);

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [direction, language]);

  return <LanguageContext value={contextValue}>{children}</LanguageContext>;
}
