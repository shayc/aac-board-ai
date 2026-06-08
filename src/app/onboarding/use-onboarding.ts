import { createPersistedStore } from "@shared/utils/persisted-store";
import { useSyncExternalStore } from "react";

const store = createPersistedStore<boolean>("hasSeenOnboarding", (raw) =>
  typeof raw === "boolean" ? raw : false,
);

export interface UseOnboardingReturn {
  shouldShow: boolean;
  dismiss: () => void;
}

export function useOnboarding(): UseOnboardingReturn {
  const hasSeen = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return {
    shouldShow: !hasSeen,
    dismiss: () => store.setState(true),
  };
}
