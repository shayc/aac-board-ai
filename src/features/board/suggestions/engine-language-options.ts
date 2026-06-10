export interface ProofreaderLanguageOptions {
  expectedInputLanguages: string[];
}

export interface RewriterLanguageOptions {
  expectedInputLanguages: string[];
  expectedContextLanguages: string[];
  outputLanguage: string;
}

export function proofreaderLanguageOptions(
  language: string,
): ProofreaderLanguageOptions {
  return { expectedInputLanguages: [language] };
}

export function rewriterLanguageOptions(
  language: string,
): RewriterLanguageOptions {
  return {
    expectedInputLanguages: [language],
    expectedContextLanguages: [language],
    outputLanguage: language,
  };
}
