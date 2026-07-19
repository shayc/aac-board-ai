import type {
  LanguageModelOptions,
  ProofreaderOptions,
  RewriterOptions,
} from "@shayc/react-built-in-ai";

type ProofreaderLanguageOptions = Required<
  Pick<ProofreaderOptions, "expectedInputLanguages">
>;

type RewriterLanguageOptions = Required<
  Pick<
    RewriterOptions,
    "expectedInputLanguages" | "expectedContextLanguages" | "outputLanguage"
  >
>;

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

type LanguageModelLanguageOptions = Required<
  Pick<LanguageModelOptions, "expectedInputs" | "expectedOutputs">
>;

export function languageModelLanguageOptions(
  language: string,
): LanguageModelLanguageOptions {
  return {
    expectedInputs: [{ type: "text", languages: [language] }],
    expectedOutputs: [{ type: "text", languages: [language] }],
  };
}
