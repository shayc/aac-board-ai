import { usePersistentState } from "@/shared/hooks/usePersistentState";
import { useSpeech } from "@shared/contexts/SpeechProvider/SpeechProvider";
import { createContext, type ReactNode } from "react";

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
  const uniqueLangs = Array.from(new Set(langs.map((l) => l.split("-")[0])));

  const [languageCode, setLanguageCode] = usePersistentState<string>(
    "languageCode",
    "en"
  );

  const languages = uniqueLangs.map((lang) => {
    const displayName = new Intl.DisplayNames([lang], { type: "language" });

    return {
      code: lang,
      name: displayName.of(lang) || lang,
    };
  });

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
