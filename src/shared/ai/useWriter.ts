import { type CreateOptions } from "./built-in-ai/spec";
import {
  type UseBuiltInAIResult,
  useBuiltInAI,
} from "./built-in-ai/useBuiltInAI";

export const useWriter = (
  options?: CreateOptions<"Writer">,
): UseBuiltInAIResult<"Writer"> => useBuiltInAI("Writer", options);
