import { useEffect, useRef } from "react";
import { useRevalidator } from "react-router";
import { useLanguage } from "./use-language";

// Board translations are resolved in the route loader, so a language change must
// re-run the loaders to re-translate the board currently on screen.
export function useRevalidateOnLanguageChange(): void {
  const { language } = useLanguage();
  const { revalidate } = useRevalidator();
  const previousLanguage = useRef(language);

  useEffect(() => {
    if (previousLanguage.current === language) {
      return;
    }

    previousLanguage.current = language;
    void revalidate();
  }, [language, revalidate]);
}
