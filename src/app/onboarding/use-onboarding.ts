import { createPersistedStore } from "@shared/state/persisted-store";
import { useSyncExternalStore } from "react";

const onboardingStore = createPersistedStore<boolean>(
  "has-seen-onboarding",
  (raw) => (typeof raw === "boolean" ? raw : false),
);

interface UseOnboardingReturn {
  shouldShow: boolean;
  dismiss: () => void;
}

export function useOnboarding(): UseOnboardingReturn {
  const hasSeen = useSyncExternalStore(
    onboardingStore.subscribe,
    onboardingStore.getSnapshot,
  );

  return {
    shouldShow: !hasSeen,
    dismiss: () => onboardingStore.setState(true),
  };
}
