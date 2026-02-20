import { createExternalStore } from "@shared/utils/external-store";
import { useEffect, useRef, useSyncExternalStore } from "react";

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

  function setPageTitle(value: string | undefined) {
    const next = value ?? "";
    if (store.getState() !== next) {
      store.setState(next);
      ownsTitle.current = next !== "";
    }
  }

  const pageTitle = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return { pageTitle, setPageTitle };
}
