import { createContext } from "react";

export interface LanguageContextValue {
  languages: { code: string; name: string }[];
  locale: string;
  setLocale: (locale: string) => void;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);
