import { type CreateOptions } from "./core/built-in-ai";
import { type UseBuiltInAIResult, useBuiltInAI } from "./core/useBuiltInAI";

export const useSummarizer = (
  options?: CreateOptions<"Summarizer">,
): UseBuiltInAIResult<"Summarizer"> => useBuiltInAI("Summarizer", options);
