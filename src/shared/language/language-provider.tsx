import { useVoiceLanguageSync } from "@shared/speech/use-voice-language-sync";
import { getTextDirection } from "@shared/utils/locale";
import { useLayoutEffect, type ReactNode } from "react";
import { LanguageContext } from "./language-context";
import { setStoredLanguage, useStoredLanguage } from "./language-store";

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const language = useStoredLanguage();
  const direction = getTextDirection(language);

  useLayoutEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [direction, language]);

  useVoiceLanguageSync(language);

  const contextValue = {
    language,
    setLanguage: setStoredLanguage,
    direction,
  };

  return <LanguageContext value={contextValue}>{children}</LanguageContext>;
}
