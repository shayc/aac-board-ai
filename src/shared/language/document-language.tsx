import { useLayoutEffect } from "react";
import { useUIDirection, useUILocale } from "./language-store";

export function DocumentLanguage() {
  const uiLocale = useUILocale();
  const uiDirection = useUIDirection();

  useLayoutEffect(() => {
    document.documentElement.lang = uiLocale;
    document.documentElement.dir = uiDirection;
  }, [uiLocale, uiDirection]);

  return null;
}
