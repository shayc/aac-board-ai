import { useLayoutEffect } from "react";
import { useLanguage } from "./use-language";

export function DocumentLanguage() {
  const { language, direction } = useLanguage();

  useLayoutEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [direction, language]);

  return null;
}
