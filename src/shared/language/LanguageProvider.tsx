import { usePersistentState } from "@shared/hooks/usePersistentState";
import { useSpeech } from "@shared/speech/useSpeech";
import { useEffect, type ReactNode } from "react";
import { getPrimaryLanguage } from "./locale";
import { LanguageContext, type LanguageContextValue } from "./LanguageContext";

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

  const contextValue: LanguageContextValue = {
    languages,
    language,
    setLanguage,
  };

  useEffect(() => {
    const defaultVoice =
      voicesByLanguage[language]?.find((voice) => voice.default) ??
      voicesByLanguage[language]?.[0];

    if (defaultVoice) {
      setVoiceURI(defaultVoice.voiceURI);
    }
  }, [language, voicesByLanguage, setVoiceURI]);

  return <LanguageContext value={contextValue}>{children}</LanguageContext>;
}
