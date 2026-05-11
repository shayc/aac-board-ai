import { createExternalStore } from "@shared/utils/external-store";
import { useEffect, useSyncExternalStore } from "react";

const store = createExternalStore("");

export function useHeaderTitle(): string {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

export function useDeclareHeaderTitle(title: string | undefined): void {
  useEffect(() => {
    const next = title ?? "";
    if (store.getSnapshot() !== next) {
      store.setState(next);
    }
  }, [title]);

  useEffect(() => {
    return () => {
      if (store.getSnapshot() !== "") {
        store.setState("");
      }
    };
  }, []);
}
