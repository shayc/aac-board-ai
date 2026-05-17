import { type CreateOptions } from "./built-in-ai";
import { type UseBuiltInAIResult, useBuiltInAI } from "./useBuiltInAI";

export const useLanguageDetector = (
  options?: CreateOptions<"LanguageDetector">,
): UseBuiltInAIResult<"LanguageDetector"> =>
  useBuiltInAI("LanguageDetector", options);
