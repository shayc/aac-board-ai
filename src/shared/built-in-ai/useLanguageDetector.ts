import { type CreateOptions } from "./core/built-in-ai";
import { type UseBuiltInAIResult, useBuiltInAI } from "./core/useBuiltInAI";

export const useLanguageDetector = (
  options?: CreateOptions<"LanguageDetector">,
): UseBuiltInAIResult<"LanguageDetector"> =>
  useBuiltInAI("LanguageDetector", options);
