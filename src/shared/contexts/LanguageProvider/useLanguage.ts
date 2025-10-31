import { use } from "react";
import { LanguageContext, type LanguageContextValue } from "./LanguageProvider";

export function useLanguage(): LanguageContextValue {
  const context = use(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}
