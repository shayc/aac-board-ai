import { usePersistentState } from "@shared/hooks/use-persistent-state";
import { useSpeech } from "@shared/speech/use-speech";
import { useEffect, type ReactNode } from "react";
import { LanguageContext, type LanguageContextValue } from "./language-context";
import { getLanguageDirection, getPrimaryLanguage } from "./locale";

export interface LanguageProviderProps {
  children: ReactNode;
}

const UNSUPPORTED_LANGUAGES = ["ca", "ms", "nb", "yue"];

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { locales, voicesByLanguage, setVoiceURI } = useSpeech();

  const [language, setLanguage] = usePersistentState<string>("language", "en");

  const supportedLanguages = Array.from(
    new Set(locales.map(getPrimaryLanguage)),
  ).filter((langCode) => !UNSUPPORTED_LANGUAGES.includes(langCode));

  const languages = supportedLanguages.map((lang) => {
    const displayName = new Intl.DisplayNames([lang], { type: "language" });

    return {
      code: lang,
      name: displayName.of(lang) ?? lang,
    };
  });

  const direction = getLanguageDirection(language);

  const contextValue: LanguageContextValue = {
    languages,
    language,
    setLanguage,
    direction,
  };

  useEffect(() => {
    const defaultVoice =
      voicesByLanguage[language]?.find((voice) => voice.default) ??
      voicesByLanguage[language]?.[0];

    if (defaultVoice) {
      setVoiceURI(defaultVoice.voiceURI);
    }
  }, [language, voicesByLanguage, setVoiceURI]);

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [direction, language]);

  return <LanguageContext value={contextValue}>{children}</LanguageContext>;
}
