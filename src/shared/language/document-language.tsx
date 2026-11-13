import { useLayoutEffect } from "react";
import { useUILocale } from "./language-store";
import { useLanguage } from "./use-language";

export function DocumentLanguage() {
  const { direction } = useLanguage();
  // A communication language without a message catalog still shows the UI in
  // the fallback locale, and `lang` has to name the language of that text.
  const uiLocale = useUILocale();

  useLayoutEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = uiLocale;
  }, [direction, uiLocale]);

  return null;
}
