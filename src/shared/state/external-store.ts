import { useSyncExternalStore } from "react";

type StateUpdate<T> = T | ((current: T) => T);

export interface ExternalStore<T> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  setState: (next: StateUpdate<T>) => void;
}

export function createExternalStore<T>(initialState: T): ExternalStore<T> {
  let state = initialState;
  const listeners = new Set<() => void>();

  function emit() {
    for (const notify of listeners) {
      notify();
    }
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }

  function getSnapshot() {
    return state;
  }

  function setState(next: StateUpdate<T>) {
    state =
      typeof next === "function" ? (next as (current: T) => T)(state) : next;
    emit();
  }

  return { subscribe, getSnapshot, setState };
}

export function patchState<T extends object>(
  store: Pick<ExternalStore<T>, "setState">,
  patch: Partial<T>,
): void {
  store.setState((state) => ({ ...state, ...patch }));
}

type SubscribableStore<T> = Pick<ExternalStore<T>, "subscribe" | "getSnapshot">;

export function useExternalStore<T>(store: SubscribableStore<T>): T;
export function useExternalStore<T, Selected>(
  store: SubscribableStore<T>,
  select: (state: T) => Selected,
): Selected;
export function useExternalStore<T, Selected>(
  store: SubscribableStore<T>,
  select?: (state: T) => Selected,
): T | Selected {
  return useSyncExternalStore(store.subscribe, () => {
    const state = store.getSnapshot();

    return select ? select(state) : state;
  });
}
