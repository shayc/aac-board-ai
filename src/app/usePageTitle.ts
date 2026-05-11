import { createExternalStore } from "@shared/utils/external-store";
import { useEffect, useRef, useSyncExternalStore } from "react";

// Singleton store — assumes one page owns the title at a time (enforced by the router).
const store = createExternalStore("");

export function usePageTitle() {
  const ownsTitle = useRef(false);

  useEffect(() => {
    return () => {
      if (ownsTitle.current) {
        ownsTitle.current = false;
        store.setState("");
      }
    };
  }, []);

  function setPageTitle(title: string | undefined) {
    const next = title ?? "";
    if (store.getSnapshot() !== next) {
      store.setState(next);
      ownsTitle.current = next !== "";
    }
  }

  const pageTitle = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return { pageTitle, setPageTitle };
}
