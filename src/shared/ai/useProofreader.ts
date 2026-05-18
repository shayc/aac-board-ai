import { type CreateOptions } from "./built-in-ai/namespaces";
import {
  type UseBuiltInAIResult,
  useBuiltInAI,
} from "./built-in-ai/useBuiltInAI";

export const useProofreader = (
  options?: CreateOptions<"Proofreader">,
): UseBuiltInAIResult<"Proofreader"> => useBuiltInAI("Proofreader", options);
