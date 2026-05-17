import { type CreateOptions } from "./built-in-ai/spec";
import {
  type UseBuiltInAIResult,
  useBuiltInAI,
} from "./built-in-ai/useBuiltInAI";

export const useLanguageDetector = (
  options?: CreateOptions<"LanguageDetector">,
): UseBuiltInAIResult<"LanguageDetector"> =>
  useBuiltInAI("LanguageDetector", options);
