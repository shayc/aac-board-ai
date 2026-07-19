import type { Locale } from "@paraglide/runtime";
import { createContext } from "react";

export interface LanguageContextValue {
  communicationLanguage: string;
  setCommunicationLanguage: (language: string) => void;
  uiLocale: Locale;
  languages: { code: string; name: string }[];
  direction: "ltr" | "rtl";
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);
