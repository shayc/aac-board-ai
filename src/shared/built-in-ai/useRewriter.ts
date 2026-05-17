import { type CreateOptions } from "./core/built-in-ai";
import { type UseBuiltInAIResult, useBuiltInAI } from "./core/useBuiltInAI";

export const useRewriter = (
  options?: CreateOptions<"Rewriter">,
): UseBuiltInAIResult<"Rewriter"> => useBuiltInAI("Rewriter", options);
