function parseLocale(locale: string): Intl.Locale | undefined {
  try {
    return new Intl.Locale(locale.replaceAll("_", "-"));
  } catch {
    return undefined;
  }
}

/** Accepts `_` separators, strips extensions, and preserves invalid input. */
export function normalizeLocale(locale: string): string {
  return parseLocale(locale)?.baseName ?? locale;
}

export function getLanguageCode(locale: string): string {
  const [language = ""] = locale.split(/[_-]/, 1);

  return language.toLowerCase();
}

export function getRegionCode(locale: string): string | undefined {
  return parseLocale(locale)?.region;
}

export function getLikelyRegionCode(language: string): string | undefined {
  return parseLocale(language)?.maximize().region;
}

export function getNativeLanguageName(locale: string): string {
  const language = getLanguageCode(locale);

  try {
    return (
      new Intl.DisplayNames([language], { type: "language" }).of(language) ??
      language
    );
  } catch {
    return language;
  }
}
