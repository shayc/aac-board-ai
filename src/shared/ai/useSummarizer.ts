import { type CreateOptions } from "./built-in-ai/namespaces";
import {
  type UseBuiltInAIResult,
  useBuiltInAI,
} from "./built-in-ai/useBuiltInAI";

export const useSummarizer = (
  options?: CreateOptions<"Summarizer">,
): UseBuiltInAIResult<"Summarizer"> => useBuiltInAI("Summarizer", options);
