import { type CreateOptions } from "./built-in-ai";
import { type UseBuiltInAIResult, useBuiltInAI } from "./useBuiltInAI";

export const useProofreader = (
  options?: CreateOptions<"Proofreader">,
): UseBuiltInAIResult<"Proofreader"> => useBuiltInAI("Proofreader", options);
