import { type CreateOptions } from "./built-in-ai/spec";
import {
  type UseBuiltInAIResult,
  useBuiltInAI,
} from "./built-in-ai/useBuiltInAI";

export const useRewriter = (
  options?: CreateOptions<"Rewriter">,
): UseBuiltInAIResult<"Rewriter"> => useBuiltInAI("Rewriter", options);
