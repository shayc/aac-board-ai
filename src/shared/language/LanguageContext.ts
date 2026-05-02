import { createContext } from "react";

export interface LanguageContextValue {
  languages: { code: string; name: string }[];
  language: string;
  setLanguage: (language: string) => void;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);
