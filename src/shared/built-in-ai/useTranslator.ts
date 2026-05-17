import { type CreateOptions } from "./core/built-in-ai";
import { type UseBuiltInAIResult, useBuiltInAI } from "./core/useBuiltInAI";

export const useTranslator = (
  options: CreateOptions<"Translator">,
): UseBuiltInAIResult<"Translator"> => useBuiltInAI("Translator", options);
