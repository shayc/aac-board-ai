export interface Store<T> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  setState: (next: T) => void;
}

/**
 * Tiny observable. Mirrors the proven shape of the app's
 * `createExternalStore`, kept in-library on purpose (zero coupling). Its
 * `subscribe`/`getSnapshot` pair is shaped to drop straight into
 * `useSyncExternalStore`.
 */
export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot() {
      return state;
    },
    setState(next) {
      state = next;
      for (const listener of listeners) {
        listener();
      }
    },
  };
}
