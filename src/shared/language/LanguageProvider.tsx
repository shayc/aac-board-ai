import { usePersistentState } from "@shared/hooks/usePersistentState";
import { useSpeech } from "@shared/speech/useSpeech";
import { useEffect, type ReactNode } from "react";
import { LanguageContext, type LanguageContextValue } from "./LanguageContext";

export interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { langs, voicesByLang, setVoiceURI } = useSpeech();
  const [locale, setLocale] = usePersistentState<string>("locale", "en");

  const unsupportedLangs = ["ca", "ms", "nb", "yue"];
  const supportedLanguages = Array.from(
    new Set(langs.map((langCode) => langCode.split("-")[0])),
  ).filter((langCode) => !unsupportedLangs.includes(langCode));

  const languages = supportedLanguages.map((lang) => {
    const displayName = new Intl.DisplayNames([lang], { type: "language" });

    return {
      code: lang,
      name: displayName.of(lang) ?? lang,
    };
  });

  const contextValue: LanguageContextValue = {
    languages,
    locale,
    setLocale,
  };

  useEffect(() => {
    const defaultVoice =
      voicesByLang[locale]?.find((voice) => voice.default) ??
      voicesByLang[locale]?.[0];

    if (defaultVoice) {
      setVoiceURI(defaultVoice?.voiceURI);
    }
  }, [locale, voicesByLang, setVoiceURI]);

  return <LanguageContext value={contextValue}>{children}</LanguageContext>;
}
