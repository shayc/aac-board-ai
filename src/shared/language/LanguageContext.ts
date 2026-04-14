import { createContext } from "react";

export interface LanguageContextValue {
  languages: { code: string; name: string }[];
  languageCode: string;
  setLanguageCode: (languageCode: string) => void;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);
