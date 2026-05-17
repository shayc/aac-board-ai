import { type CreateOptions } from "./built-in-ai";
import { type UseBuiltInAIResult, useBuiltInAI } from "./useBuiltInAI";

export const useRewriter = (
  options?: CreateOptions<"Rewriter">,
): UseBuiltInAIResult<"Rewriter"> => useBuiltInAI("Rewriter", options);
