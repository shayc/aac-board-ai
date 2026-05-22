import { usePersistentState } from "@shared/hooks/use-persistent-state";
import { setVoiceURI, useVoicesByLanguage } from "@shared/speech/speech-store";
import {
  getLanguageCode,
  getNativeLanguageName,
  getTextDirection,
} from "@shared/utils/locale";
import { useEffect, type ReactNode } from "react";
import { isLocale, setLocale } from "../../paraglide/runtime.js";
import { LanguageContext, type LanguageContextValue } from "./language-context";

export interface LanguageProviderProps {
  children: ReactNode;
}

const UNSUPPORTED_LANGUAGES: readonly string[] = ["ca", "ms", "nb", "yue"];

export function LanguageProvider({ children }: LanguageProviderProps) {
  const voicesByLanguage = useVoicesByLanguage();

  const [language, setLanguage] = usePersistentState<string>("language", "en");

  const languages = Object.keys(voicesByLanguage)
    .filter((language) => !UNSUPPORTED_LANGUAGES.includes(language))
    .sort((a, b) => a.localeCompare(b))
    .map((language) => ({
      language,
      name: getNativeLanguageName(language),
    }));

  const direction = getTextDirection(language);

  const paraglideLocale = getLanguageCode(language);
  const knownLocale = isLocale(paraglideLocale);

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

  useEffect(() => {
    if (knownLocale) {
      void setLocale(paraglideLocale, { reload: false });
    }
  }, [paraglideLocale, knownLocale]);

  return (
    <LanguageContext value={contextValue}>
      <div key={paraglideLocale} style={{ display: "contents" }}>
        {children}
      </div>
    </LanguageContext>
  );
}
