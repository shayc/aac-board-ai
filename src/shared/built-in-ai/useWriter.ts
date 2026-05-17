import { type CreateOptions } from "./core/built-in-ai";
import { type UseBuiltInAIResult, useBuiltInAI } from "./core/useBuiltInAI";

export const useWriter = (
  options?: CreateOptions<"Writer">,
): UseBuiltInAIResult<"Writer"> => useBuiltInAI("Writer", options);
