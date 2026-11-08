import { useStore } from "@shared/state/external-store";
import { createPersistedStore } from "@shared/state/persisted-store";
import { parseBoolean } from "@shared/utils/parse-boolean";

const onboardingStore = createPersistedStore<boolean>(
  "has-seen-onboarding",
  (raw) => parseBoolean(raw, false),
);

interface UseOnboardingReturn {
  shouldShow: boolean;
  dismiss: () => void;
}

export function useOnboarding(): UseOnboardingReturn {
  const hasSeen = useStore(onboardingStore);

  return {
    shouldShow: !hasSeen,
    dismiss: () => onboardingStore.setState(true),
  };
}
