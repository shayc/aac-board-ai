import { usePersistentState } from "@shared/hooks/usePersistentState";

const STORAGE_KEY = "hasSeenOnboarding";

export interface UseOnboardingReturn {
  shouldShow: boolean;
  dismiss: () => void;
}

export function useOnboarding(): UseOnboardingReturn {
  const [hasSeen, setHasSeen] = usePersistentState(STORAGE_KEY, false);

  return {
    shouldShow: !hasSeen,
    dismiss: () => setHasSeen(true),
  };
}
