/**
 * Normalizes a BCP-47 locale code to canonical casing
 * (lowercase language subtag, uppercase region subtag, hyphen separator).
 */
export function normalizeLocaleCode(code: string): string {
  const [language, region] = code.split(/[_-]/);

  if (!region) {
    return language.toLowerCase();
  }

  return `${language.toLowerCase()}-${region.toUpperCase()}`;
}

/**
 * Extracts the primary language subtag from a BCP-47 locale code
 * (e.g. "en-US" → "en"). Always lowercase.
 */
export function getPrimaryLanguage(code: string): string {
  return code.split(/[_-]/)[0].toLowerCase();
}

/**
 * Returns the display name of a locale code in English.
 * Falls back to the original code if the locale is not recognized.
 */
export function getLocaleDisplayName(code: string): string {
  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "language" });
    return displayNames.of(normalizeLocaleCode(code)) ?? code;
  } catch {
    return code;
  }
}
