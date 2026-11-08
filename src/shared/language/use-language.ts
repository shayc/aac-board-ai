import { getTextDirection } from "@paraglide/runtime";
import { setStoredLanguage, useStoredLanguage } from "./language-store";

export function useLanguage() {
  const language = useStoredLanguage();

  return {
    language,
    direction: getTextDirection(language),
    setLanguage: setStoredLanguage,
  };
}
