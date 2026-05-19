import { useEffect, useState, useSyncExternalStore } from "react";
import { shallowEqualOptions } from "../util/options-equality.ts";
import { createStore } from "./store.ts";
import type { AINamespace, DestroyableInstance } from "./types.ts";

/** Stabilizes the options reference so effects re-run on real changes only. */
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
  Instance extends DestroyableInstance,
>(globalName: string, options: Options | undefined) {
  const stableOptions = useStableOptions(options);
  const namespace = (globalThis as Record<string, unknown>)[globalName] as
    | AINamespace<Options, Instance>
    | undefined;

  const [store] = useState(() => createStore<Options, Instance>(globalName));

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
