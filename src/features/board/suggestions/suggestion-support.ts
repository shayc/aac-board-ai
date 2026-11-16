import {
  type AvailabilityOptionsMap,
  checkAvailability,
  isSupported,
  type Status,
} from "@shayc/react-built-in-ai";
import { continuationLanguageOptions } from "./continuation-prompt";

export const SUGGESTION_ENGINES = [
  "Proofreader",
  "Rewriter",
  "LanguageModel",
] as const;

const SUGGESTION_CONTEXT_LANGUAGE = "en";

type SuggestionEngine = (typeof SUGGESTION_ENGINES)[number];

export type SuggestionLanguageSupport =
  | "custom-instructions"
  | "suggestions-only"
  | "language-unavailable"
  | "device-unavailable";

export function areSuggestionsSupported(): boolean {
  return SUGGESTION_ENGINES.some((engine) => isSupported(engine));
}

export function isEngineUsable(status: Status): boolean {
  return status !== "unsupported" && status !== "unavailable";
}

export function proofreaderLanguageOptions(
  language: string,
): AvailabilityOptionsMap["Proofreader"] {
  return { expectedInputLanguages: [language] };
}

export function rewriterLanguageOptions(
  language: string,
): AvailabilityOptionsMap["Rewriter"] {
  return {
    expectedInputLanguages: [language],
    // The built-in suggestion context is written in English.
    expectedContextLanguages: [
      ...new Set([SUGGESTION_CONTEXT_LANGUAGE, language]),
    ],
    outputLanguage: language,
  };
}

export async function checkSuggestionLanguageSupport(
  language: string,
): Promise<SuggestionLanguageSupport> {
  const [
    isProofreaderAvailable,
    isRewriterAvailable,
    isLanguageModelAvailable,
  ] = await Promise.all([
    isEngineAvailable("Proofreader", proofreaderLanguageOptions(language)),
    isEngineAvailable("Rewriter", rewriterLanguageOptions(language)),
    isEngineAvailable("LanguageModel", continuationLanguageOptions(language)),
  ]);
  if (isRewriterAvailable) {
    return "custom-instructions";
  }
  if (isProofreaderAvailable || isLanguageModelAvailable) {
    return "suggestions-only";
  }

  // Probing without languages tells a missing language apart from a device
  // that cannot run the models at all.
  const isDeviceCapable = await isAnyEngineAvailable();

  return isDeviceCapable ? "language-unavailable" : "device-unavailable";
}

async function isEngineAvailable(
  engine: SuggestionEngine,
  options?: AvailabilityOptionsMap[SuggestionEngine],
): Promise<boolean> {
  if (!isSupported(engine)) {
    return false;
  }

  return (await checkAvailability(engine, options)) !== "unavailable";
}

async function isAnyEngineAvailable(): Promise<boolean> {
  const availabilities = await Promise.all(
    SUGGESTION_ENGINES.map((engine) => isEngineAvailable(engine)),
  );

  return availabilities.includes(true);
}
