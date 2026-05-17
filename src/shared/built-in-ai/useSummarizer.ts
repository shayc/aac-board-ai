import { type CreateOptions } from "./built-in-ai";
import { type UseBuiltInAIResult, useBuiltInAI } from "./useBuiltInAI";

export const useSummarizer = (
  options?: CreateOptions<"Summarizer">,
): UseBuiltInAIResult<"Summarizer"> => useBuiltInAI("Summarizer", options);
