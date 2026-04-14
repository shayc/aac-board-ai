/**
 * Normalizes a locale code to BCP 47 format.
 */
export function normalizeLocaleCode(code: string): string {
  const [language, region] = code.split(/[_-]/);

  if (!region) {
    return language.toLowerCase();
  }

  return `${language.toLowerCase()}-${region.toUpperCase()}`;
}

/**
 * Returns the display name of a locale code in English.
 * Falls back to the original code if the locale is not recognized.
 */
export function getLanguageDisplayName(code: string): string {
  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "language" });
    return displayNames.of(normalizeLocaleCode(code)) ?? code;
  } catch {
    return code;
  }
}
