import { type CreateOptions } from "./built-in-ai";
import { type UseBuiltInAIResult, useBuiltInAI } from "./useBuiltInAI";

export const useTranslator = (
  options: CreateOptions<"Translator">,
): UseBuiltInAIResult<"Translator"> => useBuiltInAI("Translator", options);
