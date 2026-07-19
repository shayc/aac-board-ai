import { baseLocale, isLocale, setLocale } from "@paraglide/runtime";
import { useVoiceLanguageSync } from "@shared/speech/use-voice-language-sync";
import { getTextDirection } from "@shared/utils/locale";
import { useLayoutEffect, type ReactNode } from "react";
import { LanguageContext, type LanguageContextValue } from "./language-context";
import { setStoredLanguage, useStoredLanguage } from "./language-store";
import { useAvailableLanguages } from "./use-available-languages";

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const language = useStoredLanguage();
  const languages = useAvailableLanguages();
  const direction = getTextDirection(language);

  // Sync Paraglide locale during render so children see translated strings on first paint.
  void setLocale(isLocale(language) ? language : baseLocale, { reload: false });

  useLayoutEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [direction, language]);

  useVoiceLanguageSync({ language });

  const contextValue: LanguageContextValue = {
    language,
    setLanguage: setStoredLanguage,
    languages,
    direction,
  };

  return <LanguageContext value={contextValue}>{children}</LanguageContext>;
}
