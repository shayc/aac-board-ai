function parseLocale(locale: string): Intl.Locale {
  return new Intl.Locale(locale.replaceAll("_", "-"));
}

/**
 * Returns the canonical BCP 47 base name, accepting `_` separators and
 * stripping extensions. Returns the input unchanged when parsing fails.
 */
export function normalizeLocale(locale: string): string {
  try {
    return parseLocale(locale).baseName;
  } catch {
    return locale;
  }
}

export function getLanguageCode(locale: string): string {
  return locale.split(/[_-]/)[0].toLowerCase();
}

/** Returns only an explicit region subtag (`fr-CA` → `CA`; `fr` → none). */
export function getRegionCode(locale: string): string | undefined {
  try {
    return parseLocale(locale).region;
  } catch {
    return undefined;
  }
}

/** Infers the most likely region (`fr` → `FR`; `en` → `US`). */
export function getLikelyRegion(language: string): string | undefined {
  try {
    return parseLocale(language).maximize().region;
  } catch {
    return undefined;
  }
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
