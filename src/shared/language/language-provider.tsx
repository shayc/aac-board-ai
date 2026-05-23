import { baseLocale, isLocale, setLocale } from "@paraglide/runtime";
import { isSupportedLanguage } from "@shared/built-in-ai/translator/is-supported-language";
import { usePersistentState } from "@shared/hooks/use-persistent-state";
import {
  selectDefaultVoiceFor,
  useVoicesByLanguage,
} from "@shared/speech/speech-store";
import { getNativeLanguageName, getTextDirection } from "@shared/utils/locale";
import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { LanguageContext, type LanguageContextValue } from "./language-context";

export interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const voicesByLanguage = useVoicesByLanguage();
  const [language, setLanguage] = usePersistentState<string>("language", "en");

  const direction = getTextDirection(language);
  const languages = Object.keys(voicesByLanguage)
    .filter(isSupportedLanguage)
    .sort((a, b) => a.localeCompare(b))
    .map((language) => ({
      language,
      name: getNativeLanguageName(language),
    }));

  // Sync Paraglide locale during render so children see translated strings on first paint.
  void setLocale(isLocale(language) ? language : baseLocale, { reload: false });

  useLayoutEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [direction, language]);

  useEffect(() => {
    selectDefaultVoiceFor(language);
  }, [language, voicesByLanguage]);

  const contextValue: LanguageContextValue = {
    languages,
    language,
    setLanguage,
    direction,
  };

  return <LanguageContext value={contextValue}>{children}</LanguageContext>;
}
