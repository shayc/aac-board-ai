import { useVoiceLanguageSync } from "@shared/speech/use-voice-language-sync";
import { getTextDirection } from "@shared/utils/locale";
import { useLayoutEffect, type ReactNode } from "react";
import { LanguageContext, type LanguageContextValue } from "./language-context";
import {
  resolveUiLocale,
  setStoredLanguage,
  useStoredLanguage,
} from "./language-store";
import { useAvailableLanguages } from "./use-available-languages";

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const communicationLanguage = useStoredLanguage();
  const uiLocale = resolveUiLocale(communicationLanguage);
  const languages = useAvailableLanguages();
  const direction = getTextDirection(communicationLanguage);

  useLayoutEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = communicationLanguage;
  }, [communicationLanguage, direction]);

  useVoiceLanguageSync({ language: communicationLanguage });

  const contextValue: LanguageContextValue = {
    communicationLanguage,
    setCommunicationLanguage: setStoredLanguage,
    uiLocale,
    languages,
    direction,
  };

  return <LanguageContext value={contextValue}>{children}</LanguageContext>;
}
