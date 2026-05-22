import {
  baseLocale,
  isLocale,
  overwriteGetLocale,
  type Locale,
} from "@paraglide/runtime";

let current: Locale = baseLocale;

overwriteGetLocale(() => current);

export function syncUILocale(language: string): void {
  current = isLocale(language) ? language : baseLocale;
}
