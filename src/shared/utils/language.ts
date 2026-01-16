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
