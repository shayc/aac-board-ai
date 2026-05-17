import { type CreateOptions } from "./core/built-in-ai";
import { type UseBuiltInAIResult, useBuiltInAI } from "./core/useBuiltInAI";

export const useProofreader = (
  options?: CreateOptions<"Proofreader">,
): UseBuiltInAIResult<"Proofreader"> => useBuiltInAI("Proofreader", options);
