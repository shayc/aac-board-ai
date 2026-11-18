import { useSyncExternalStore } from "react";

export interface ExternalStore<State> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => State;
  setState: (next: State) => void;
}

export function createExternalStore<State>(
  initialState: State,
): ExternalStore<State> {
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

  function setState(next: State) {
    state = next;
    emit();
  }

  return { subscribe, getSnapshot, setState };
}

export function patchState<State extends object>(
  store: Pick<ExternalStore<State>, "getSnapshot" | "setState">,
  patch: Partial<State>,
): void {
  store.setState({ ...store.getSnapshot(), ...patch });
}

type SubscribableStore<State> = Pick<
  ExternalStore<State>,
  "subscribe" | "getSnapshot"
>;

export function useExternalStore<State>(store: SubscribableStore<State>): State;
export function useExternalStore<State, Selected>(
  store: SubscribableStore<State>,
  select: (state: State) => Selected,
): Selected;
export function useExternalStore<State, Selected>(
  store: SubscribableStore<State>,
  select?: (state: State) => Selected,
): State | Selected {
  return useSyncExternalStore(store.subscribe, () => {
    const state = store.getSnapshot();

    return select ? select(state) : state;
  });
}
