import { type CreateOptions } from "./core/built-in-ai";
import { type UseBuiltInAIResult, useBuiltInAI } from "./core/useBuiltInAI";

export const useLanguageModel = (
  options?: CreateOptions<"LanguageModel">,
): UseBuiltInAIResult<"LanguageModel"> =>
  useBuiltInAI("LanguageModel", options);
