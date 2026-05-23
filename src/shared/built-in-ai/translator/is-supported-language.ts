const UNSUPPORTED_LANGUAGES: readonly string[] = ["ca", "ms", "nb", "yue"];

export function isSupportedLanguage(language: string): boolean {
  return !UNSUPPORTED_LANGUAGES.includes(language);
}
