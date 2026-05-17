import { type CreateOptions } from "./built-in-ai";
import { type UseBuiltInAIResult, useBuiltInAI } from "./useBuiltInAI";

export const useLanguageModel = (
  options?: CreateOptions<"LanguageModel">,
): UseBuiltInAIResult<"LanguageModel"> =>
  useBuiltInAI("LanguageModel", options);
