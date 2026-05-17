import { type CreateOptions } from "./built-in-ai/spec";
import {
  type UseBuiltInAIResult,
  useBuiltInAI,
} from "./built-in-ai/useBuiltInAI";

export const useLanguageModel = (
  options?: CreateOptions<"LanguageModel">,
): UseBuiltInAIResult<"LanguageModel"> =>
  useBuiltInAI("LanguageModel", options);
