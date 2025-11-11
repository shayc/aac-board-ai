import { isAvailable, proofread } from "@features/ai/aiService";
import { useAsyncOperation } from "./useAsyncOperation";

/**
 * Hook for proofreading text
 *
 * Wraps the aiService.proofread function with async state management
 */
export function useProofread() {
  const available = isAvailable("proofreader");

  const operation = useAsyncOperation<string, [string]>(
    async (signal, text) => {
      return proofread(text, signal);
    },
  );

  return {
    available,
    ...operation,
  };
}
