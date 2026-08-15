import { useLanguage } from "@shared/language/use-language";
import { useEffect, useRef } from "react";
import { useRevalidator } from "react-router";

// Board translations are resolved in the route loader, so a language change must
// re-run the loaders to re-translate the board currently on screen.
export function useRevalidateBoardOnLanguageChange(): void {
  const { language } = useLanguage();
  const { revalidate } = useRevalidator();
  const previousLanguageRef = useRef(language);

  useEffect(() => {
    if (previousLanguageRef.current === language) {
      return;
    }

    previousLanguageRef.current = language;
    void revalidate();
  }, [language, revalidate]);
}
