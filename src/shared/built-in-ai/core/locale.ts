/**
 * Minimal, self-contained BCP-47 normalizer (lowercase language subtag,
 * uppercase region subtag, hyphen separator). Intentionally duplicated rather
 * than imported so the library stays zero-coupling and extractable.
 */
export function bcp47(code: string): string {
  const [language, region] = code.split(/[_-]/);

  if (!region) {
    return language.toLowerCase();
  }

  return `${language.toLowerCase()}-${region.toUpperCase()}`;
}
