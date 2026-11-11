import { useLayoutEffect } from "react";
import { useUILocale } from "./language-store";
import { useLanguage } from "./use-language";

export function DocumentLanguage() {
  const { direction } = useLanguage();
  // The language the interface is written in, not the one chosen: a language
  // offered for its voice alone has no message catalog and reads in English.
  const uiLocale = useUILocale();

  useLayoutEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = uiLocale;
  }, [direction, uiLocale]);

  return null;
}
