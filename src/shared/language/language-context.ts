import { createContext } from "react";

interface LanguageContextValue {
  readonly language: string;
  readonly direction: "ltr" | "rtl";
  setLanguage: (language: string) => void;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);
