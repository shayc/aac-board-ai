const englishLanguageNames = new Intl.DisplayNames(["en"], {
  type: "language",
  languageDisplay: "dialect",
});

function parseLocale(locale: string): Intl.Locale {
  return new Intl.Locale(locale.replace(/_/g, "-"));
}

/**
 * Normalizes a BCP-47 locale code to canonical casing
 * (lowercase language subtag, uppercase region subtag, hyphen separator).
 */
export function normalizeLocale(locale: string): string {
  try {
    return parseLocale(locale).baseName;
  } catch {
    return locale;
  }
}

/**
 * Extracts the primary language subtag from a BCP-47 locale code
 * (e.g. "en-US" → "en"). Always lowercase.
 */
export function getLanguageCode(locale: string): string {
  return locale.split(/[_-]/)[0].toLowerCase();
}

/**
 * Returns the uppercase region subtag of a locale code, or undefined when
 * none is present (e.g. "fr-CA" → "CA", "fr" → undefined).
 */
export function getRegionCode(locale: string): string | undefined {
  try {
    return parseLocale(locale).region;
  } catch {
    return undefined;
  }
}

/**
 * Returns the region most associated with a language via CLDR likely-subtags
 * (e.g. "fr" → "FR", "en" → "US"). Undefined for unrecognized input.
 */
export function getLikelyRegion(language: string): string | undefined {
  try {
    return parseLocale(language).maximize().region;
  } catch {
    return undefined;
  }
}

/**
 * Returns the writing direction for a BCP-47 locale code.
 * Falls back to "ltr" for structurally invalid input; unknown
 * but well-formed codes default to "ltr" via Intl.
 */
export function getTextDirection(locale: string): "ltr" | "rtl" {
  try {
    return parseLocale(locale).getTextInfo().direction ?? "ltr";
  } catch {
    return "ltr";
  }
}

/**
 * Returns the language name of a locale code in English
 * (e.g. "he-IL" → "Hebrew").
 * Falls back to the original code if the locale is not recognized.
 */
export function getEnglishLanguageName(locale: string): string {
  try {
    return englishLanguageNames.of(normalizeLocale(locale)) ?? locale;
  } catch {
    return locale;
  }
}

/**
 * Returns the language name in its own language (endonym),
 * e.g. "es" → "español", "fr" → "français".
 */
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
