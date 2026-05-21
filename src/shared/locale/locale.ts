/**
 * Normalizes a BCP-47 locale code to canonical casing
 * (lowercase language subtag, uppercase region subtag, hyphen separator).
 */
export function normalizeLocale(locale: string): string {
  try {
    return new Intl.Locale(locale.replace(/_/g, "-")).baseName;
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

const englishLanguageNames = new Intl.DisplayNames(["en"], {
  type: "language",
});

/**
 * Returns the display name of a locale code in English.
 * Falls back to the original code if the locale is not recognized.
 */
export function getEnglishLocaleName(locale: string): string {
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

/**
 * Returns the writing direction for a BCP-47 locale code.
 * Falls back to "ltr" for structurally invalid input; unknown
 * but well-formed codes default to "ltr" via Intl.
 */
export function getTextDirection(locale: string): "ltr" | "rtl" {
  try {
    const intlLocale = new Intl.Locale(normalizeLocale(locale));
    return intlLocale.getTextInfo().direction === "rtl" ? "rtl" : "ltr";
  } catch {
    return "ltr";
  }
}
