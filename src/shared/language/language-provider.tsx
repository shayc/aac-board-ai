import { useVoiceLanguageSync } from "@shared/speech/use-voice-language-sync";
import { useLayoutEffect, type ReactNode } from "react";
import { useLanguage } from "./use-language";

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { language, direction } = useLanguage();

  useLayoutEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [direction, language]);

  useVoiceLanguageSync(language);

  return children;
}
