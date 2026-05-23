import { baseLocale, isLocale, setLocale } from "@paraglide/runtime";
import { usePersistentState } from "@shared/hooks/use-persistent-state";
import { setVoiceLanguage } from "@shared/speech/speech-store";
import { getTextDirection } from "@shared/utils/locale";
import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { LanguageContext, type LanguageContextValue } from "./language-context";
import { useAvailableLanguages } from "./use-available-languages";

export interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = usePersistentState<string>("language", "en");
  const languages = useAvailableLanguages();
  const direction = getTextDirection(language);

  // Sync Paraglide locale during render so children see translated strings on first paint.
  void setLocale(isLocale(language) ? language : baseLocale, { reload: false });

  useLayoutEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [direction, language]);

  useEffect(() => {
    setVoiceLanguage(language);
  }, [language]);

  const contextValue: LanguageContextValue = {
    languages,
    language,
    setLanguage,
    direction,
  };

  return <LanguageContext value={contextValue}>{children}</LanguageContext>;
}
