function parseLocale(locale: string): Intl.Locale {
  return new Intl.Locale(locale.replace(/_/g, "-"));
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

/**
 * Returns the explicit region subtag in canonical form, or `undefined` when
 * none is present (`fr-CA` → `CA`; `fr` → `undefined`).
 */
export function getRegionCode(locale: string): string | undefined {
  try {
    return parseLocale(locale).region;
  } catch {
    return undefined;
  }
}

/**
 * Returns the region inferred by `Intl.Locale.maximize()` (`fr` → `FR`;
 * `en` → `US`), or `undefined` when no region can be inferred.
 */
export function getLikelyRegion(language: string): string | undefined {
  try {
    return parseLocale(language).maximize().region;
  } catch {
    return undefined;
  }
}

/** Returns the primary language's endonym (`es` → `español`; `fr` → `français`). */
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
