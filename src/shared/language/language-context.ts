import { createContext } from "react";

export interface LanguageContextValue {
  language: string;
  setLanguage: (language: string) => void;
  languages: { code: string; name: string }[];
  direction: "ltr" | "rtl";
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);
