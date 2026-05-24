import {
  type UsePersistentStateReturn,
  usePersistentState,
} from "@shared/hooks/use-persistent-state";

const STORAGE_KEY = "ai-shared-context";

export function useAISharedContext(): UsePersistentStateReturn<string> {
  return usePersistentState<string>(STORAGE_KEY, "");
}
