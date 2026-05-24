const TRANSLATOR_UNSUPPORTED_LANGUAGES: readonly string[] = [
  "ca",
  "ms",
  "nb",
  "yue",
];

export function isSupportedLanguage(language: string): boolean {
  return !TRANSLATOR_UNSUPPORTED_LANGUAGES.includes(language);
}
