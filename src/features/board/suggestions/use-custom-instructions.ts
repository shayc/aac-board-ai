import {
  type UsePersistentStateReturn,
  usePersistentState,
} from "@shared/hooks/use-persistent-state";

const STORAGE_KEY = "ai-shared-context";

/**
 * User-authored instructions (tone, persona) passed to built-in AI sessions
 * as the `sharedContext` option. Persisted to `localStorage`.
 */
export function useCustomInstructions(): UsePersistentStateReturn<string> {
  return usePersistentState<string>(STORAGE_KEY, "");
}
