import { useEffect, useRef, useSyncExternalStore } from "react";

let title = "";
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) {
    fn();
  }
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot() {
  return title;
}

export function usePageTitle() {
  const ownsTitle = useRef(false);

  useEffect(() => {
    return () => {
      if (ownsTitle.current) {
        ownsTitle.current = false;
        title = "";
        emit();
      }
    };
  }, []);

  function setPageTitle(value: string | undefined) {
    const next = value ?? "";
    if (title !== next) {
      title = next;
      ownsTitle.current = next !== "";
      emit();
    }
  }

  const pageTitle = useSyncExternalStore(subscribe, getSnapshot);

  return { pageTitle, setPageTitle };
}
