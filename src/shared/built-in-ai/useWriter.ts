import { type CreateOptions } from "./built-in-ai";
import { type UseBuiltInAIResult, useBuiltInAI } from "./useBuiltInAI";

export const useWriter = (
  options?: CreateOptions<"Writer">,
): UseBuiltInAIResult<"Writer"> => useBuiltInAI("Writer", options);
