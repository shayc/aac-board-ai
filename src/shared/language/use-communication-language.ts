import { getTextDirection } from "@paraglide/runtime";
import { setStoredLanguage, useStoredLanguage } from "./language-store";

export function useCommunicationLanguage() {
  const language = useStoredLanguage();

  return {
    language,
    direction: getTextDirection(language),
    setLanguage: setStoredLanguage,
  };
}
