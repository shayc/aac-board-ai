import { m } from "@paraglide/messages.js";
import { createContext } from "react";

export interface LanguageContextValue {
  languages: { language: string; name: string }[];
  language: string;
  setLanguage: (language: string) => void;
  direction: "ltr" | "rtl";
  m: typeof m;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);
