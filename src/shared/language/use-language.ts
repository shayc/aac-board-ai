import { use } from "react";
import { LanguageContext } from "./language-context";

export function useLanguage() {
  const context = use(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}
