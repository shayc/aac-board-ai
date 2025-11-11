import { isAvailable, rewrite, type Tone } from "@features/ai/aiService";
import { useAsyncOperation } from "./useAsyncOperation";

/**
 * Hook for rewriting text with a specific tone
 *
 * Wraps the aiService.rewrite function with async state management
 */
export function useRewrite() {
  const available = isAvailable("rewriter");

  const operation = useAsyncOperation<string, [string, Tone]>(
    async (signal, text, tone) => {
      return rewrite(text, tone, signal);
    },
  );

  return {
    available,
    ...operation,
  };
}
