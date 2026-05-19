import { use } from "react";
import { LanguageContext, type LanguageContextValue } from "./language-context";

export function useLanguage(): LanguageContextValue {
  const context = use(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}
