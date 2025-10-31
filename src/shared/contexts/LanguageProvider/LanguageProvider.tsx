import { useSpeech } from "@shared/contexts/SpeechProvider/useSpeech";
import { usePersistentState } from "@shared/hooks/usePersistentState";
import { useEffect, type ReactNode } from "react";
import { LanguageContext, type LanguageContextValue } from "./LanguageContext";

export interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { langs, voicesByLang, setVoiceURI } = useSpeech();
  const [languageCode, setLanguageCode] = usePersistentState<string>(
    "languageCode",
    "en"
  );

  const unsupportedLangs = ["ca", "ms", "nb", "yue"];
  const supportedLanguages = Array.from(
    new Set(langs.map((l) => l.split("-")[0]))
  ).filter((l) => !unsupportedLangs.includes(l));

  const languages = supportedLanguages.map((lang) => {
    const displayName = new Intl.DisplayNames([lang], { type: "language" });

    return {
      code: lang,
      name: displayName.of(lang) ?? lang,
    };
  });

  const contextValue: LanguageContextValue = {
    languages,
    languageCode,
    setLanguageCode,
  };

  useEffect(() => {
    const defaultVoice =
      voicesByLang[languageCode]?.find((voice) => voice.default) ??
      voicesByLang[languageCode]?.[0];

    if (defaultVoice) {
      setVoiceURI(defaultVoice?.voiceURI);
    }
  }, [languageCode, voicesByLang, setVoiceURI]);

  return <LanguageContext value={contextValue}>{children}</LanguageContext>;
}
