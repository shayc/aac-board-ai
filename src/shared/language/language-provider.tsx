import { usePersistentState } from "@shared/hooks/use-persistent-state";
import {
  getDefaultVoice,
  setVoiceURI,
  useVoiceCatalog,
} from "@shared/speech/speech-store";
import { useEffect, type ReactNode } from "react";
import { LanguageContext, type LanguageContextValue } from "./language-context";
import {
  getLanguageDirection,
  getNativeLanguageName,
  getPrimaryLanguage,
} from "./locale";

export interface LanguageProviderProps {
  children: ReactNode;
}

const UNSUPPORTED_LANGUAGES: readonly string[] = ["ca", "ms", "nb", "yue"];

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { locales, voicesByLanguage } = useVoiceCatalog();

  const [language, setLanguage] = usePersistentState<string>("language", "en");

  const supportedLanguages = Array.from(
    new Set(locales.map(getPrimaryLanguage)),
  ).filter((langCode) => !UNSUPPORTED_LANGUAGES.includes(langCode));

  const languages = supportedLanguages.map((code) => ({
    code,
    name: getNativeLanguageName(code),
  }));

  const direction = getLanguageDirection(language);

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
