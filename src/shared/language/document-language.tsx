import { useLayoutEffect } from "react";
import { useUILocale } from "./language-store";
import { useLanguage } from "./use-language";

export function DocumentLanguage() {
  const { direction } = useLanguage();
  const uiLocale = useUILocale();

  useLayoutEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = uiLocale;
  }, [direction, uiLocale]);

  return null;
}
