import { type CreateOptions } from "./built-in-ai/namespaces";
import {
  type UseBuiltInAIResult,
  useBuiltInAI,
} from "./built-in-ai/useBuiltInAI";

export const useTranslator = (
  options: CreateOptions<"Translator">,
): UseBuiltInAIResult<"Translator"> => useBuiltInAI("Translator", options);
