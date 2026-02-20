export interface ExternalStore<T> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  getState: () => T;
  setState: (next: T) => void;
}

export function createExternalStore<T>(initialState: T): ExternalStore<T> {
  let state = initialState;
  const listeners = new Set<() => void>();

  function emit() {
    for (const fn of listeners) {
      fn();
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

  function getState() {
    return state;
  }

  function setState(next: T) {
    state = next;
    emit();
  }

  return { subscribe, getSnapshot, getState, setState };
}
