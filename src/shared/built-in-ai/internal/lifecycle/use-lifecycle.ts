import { useEffect, useState, useSyncExternalStore } from "react";
import type { BuiltInAIName } from "../../is-supported.ts";
import { createStore } from "./store.ts";
import { getNamespace } from "./types.ts";

function shallowEqualOptions<T extends object>(
  a: T | undefined,
  b: T | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) {
    return false;
  }
  const ar = a as Record<string, unknown>;
  const br = b as Record<string, unknown>;
  for (const k of keys) {
    if (!Object.is(ar[k], br[k])) {
      return false;
    }
  }
  return true;
}

function useStableOptions<T extends object>(
  options: T | undefined,
): T | undefined {
  const [stable, setStable] = useState(options);
  if (!shallowEqualOptions(stable, options)) {
    setStable(options);
  }
  return stable;
}

/** Shared lifecycle for every built-in AI namespace. Function refs are stable across renders. */
export function useLifecycle<
  Options extends object,
  Model extends DestroyableModel,
>(
  globalName: BuiltInAIName,
  options: Options | undefined,
  readQuota?: (instance: Model) => number,
) {
  const stableOptions = useStableOptions(options);
  const namespace = getNamespace<Options, Model>(globalName);

  const [store] = useState(() =>
    createStore<Options, Model>(globalName, readQuota),
  );

  useEffect(() => {
    store.start(namespace, stableOptions);
    return () => store.stop();
  }, [store, namespace, stableOptions]);

  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return {
    status: snapshot.status,
    progress: snapshot.progress,
    error: snapshot.error,
    inputQuota: snapshot.inputQuota,
    prepare: store.prepare,
    acquire: store.acquire,
  };
}
