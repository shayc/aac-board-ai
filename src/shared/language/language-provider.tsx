import { usePersistentState } from "@shared/hooks/use-persistent-state";
import {
  getDefaultVoice,
  setVoiceURI,
  useVoiceCatalog,
} from "@shared/speech/speech-store";
import { useEffect, type ReactNode } from "react";
import { LanguageContext, type LanguageContextValue } from "./language-context";
import {
  getLanguageCode,
  getNativeLanguageName,
  getTextDirection,
} from "@shared/locale/locale";

export interface LanguageProviderProps {
  children: ReactNode;
}

const UNSUPPORTED_LANGUAGES: readonly string[] = ["ca", "ms", "nb", "yue"];

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { voiceLocales, voicesByLanguage } = useVoiceCatalog();

  const [language, setLanguage] = usePersistentState<string>("language", "en");

  const supportedLanguages = Array.from(
    new Set(voiceLocales.map(getLanguageCode)),
  ).filter((language) => !UNSUPPORTED_LANGUAGES.includes(language));

  const languages = supportedLanguages.map((language) => ({
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
    const defaultVoice = getDefaultVoice(voicesByLanguage[language]);
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
