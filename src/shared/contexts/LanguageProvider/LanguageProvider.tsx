import { createContext, type ReactNode, useEffect, useState } from "react";
import { useSpeech } from "../SpeechProvider/SpeechProvider";

const LANGUAGE_STORAGE_KEY = "aac-board-language";
const DEFAULT_LANGUAGE = "en-US";

export interface LanguageContextValue {
  languages: { code: string; name: string }[];
  languageCode: string;
  setLanguageCode: (languageCode: string) => void;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { langs } = useSpeech();

  const [languageCode, setLanguageCodeState] = useState<string>(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored || DEFAULT_LANGUAGE;
  });

  const languages = langs.map((lang) => {
    const displayName = new Intl.DisplayNames([lang], { type: "language" });

    return {
      code: lang,
      name: displayName.of(lang) || lang,
    };
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  }, [languageCode]);

  const setLanguageCode = (code: string) => {
    setLanguageCodeState(code);
  };

  const contextValue: LanguageContextValue = {
    languages,
    languageCode,
    setLanguageCode,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}
