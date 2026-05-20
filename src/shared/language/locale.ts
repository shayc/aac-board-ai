/**
 * Normalizes a BCP-47 locale code to canonical casing
 * (lowercase language subtag, uppercase region subtag, hyphen separator).
 */
export function normalizeLocaleCode(code: string): string {
  try {
    return new Intl.Locale(code.replace(/_/g, "-")).baseName;
  } catch {
    return code;
  }
}

/**
 * Extracts the primary language subtag from a BCP-47 locale code
 * (e.g. "en-US" → "en"). Always lowercase.
 */
export function getPrimaryLanguage(code: string): string {
  return code.split(/[_-]/)[0].toLowerCase();
}

const languageDisplayNames = new Intl.DisplayNames(["en"], {
  type: "language",
});

/**
 * Returns the display name of a locale code in English.
 * Falls back to the original code if the locale is not recognized.
 */
export function getLocaleDisplayName(code: string): string {
  try {
    return languageDisplayNames.of(normalizeLocaleCode(code)) ?? code;
  } catch {
    return code;
  }
}

/**
 * Returns the language name in its own language (endonym),
 * e.g. "es" → "español", "fr" → "français".
 */
export function getNativeLanguageName(code: string): string {
  const primary = getPrimaryLanguage(code);
  try {
    return (
      new Intl.DisplayNames([primary], { type: "language" }).of(primary) ??
      primary
    );
  } catch {
    return primary;
  }
}

/**
 * Returns the writing direction for a BCP-47 locale code.
 * Falls back to "ltr" for structurally invalid input; unknown
 * but well-formed codes default to "ltr" via Intl.
 */
export function getLanguageDirection(code: string): "ltr" | "rtl" {
  try {
    const locale = new Intl.Locale(normalizeLocaleCode(code));
    return locale.getTextInfo().direction === "rtl" ? "rtl" : "ltr";
  } catch {
    return "ltr";
  }
}
