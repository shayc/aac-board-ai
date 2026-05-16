import { useEffect, useState, useSyncExternalStore } from "react";
import type { BuiltInAIModel } from "../core/descriptor";
import { BuiltInAIUnavailableError } from "../core/errors";
import { acquire, identityKey, type BuiltInAIHandle } from "../core/registry";
import { createStore } from "../core/store";
import type { AvailabilityState, BuiltInAIStatus } from "../core/types";

const IDLE_STATUS: BuiltInAIStatus = {
  availability: "unsupported",
  progress: 0,
};
const IDLE_SNAPSHOT = { status: IDLE_STATUS, handle: null };

function rejectingAsyncIterable(
  availability: AvailabilityState,
): AsyncIterable<string> {
  return {
    [Symbol.asyncIterator]: () => ({
      next: () => Promise.reject(new BuiltInAIUnavailableError(availability)),
    }),
  };
}

export interface UseBuiltInAIResult<
  TCall,
  TInput,
  TOutput,
  TStreaming extends boolean,
> {
  status: AvailabilityState;
  progress: number;
  run: (input: TInput, options?: TCall) => Promise<TOutput>;
  stream: BuiltInAIHandle<TCall, TInput, TOutput, TStreaming>["stream"];
}

/**
 * React binding. Owns only what React must: a ref-counted acquire/release
 * tied to the component lifecycle, and a subscription that re-renders on
 * status changes. No AI logic lives here.
 *
 * State flows through a per-hook external store rather than `setState`, so
 * the side-effecting acquire stays in `useEffect`, render stays pure, and
 * React StrictMode's double-invoke stays ref-count balanced.
 */
export function useBuiltInAI<
  TCreate,
  TCall,
  TInput,
  TOutput,
  TStreaming extends boolean,
>(
  model: BuiltInAIModel<TCreate, TCall, TInput, TOutput, TStreaming>,
  options: TCreate,
): UseBuiltInAIResult<TCall, TInput, TOutput, TStreaming> {
  const { key } = identityKey(model, options);

  const [store] = useState(() =>
    createStore<{
      status: BuiltInAIStatus;
      handle: BuiltInAIHandle<TCall, TInput, TOutput, TStreaming> | null;
    }>(IDLE_SNAPSHOT),
  );

  useEffect(() => {
    const handle = acquire(model, options);
    const push = () => store.setState({ status: handle.getStatus(), handle });
    const unsubscribe = handle.subscribe(push);
    push();
    return () => {
      unsubscribe();
      handle.release();
      store.setState(IDLE_SNAPSHOT);
    };
    // `key` captures the meaningful identity of `options`; excluding the
    // unstable `options` object reference is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-x/exhaustive-deps
  }, [store, model, key]);

  const { status, handle } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => IDLE_SNAPSHOT,
  );

  // Before the handle exists the streaming capability is still known from the
  // descriptor, so a streaming API stays callable and rejects with the typed
  // error on first pull — matching `run` instead of throwing "not a function".
  const stream = handle
    ? handle.stream
    : model.stream
      ? () => rejectingAsyncIterable(status.availability)
      : undefined;

  return {
    status: status.availability,
    progress: status.progress,
    run: (input, callOptions) =>
      handle
        ? handle.run(input, callOptions)
        : Promise.reject(new BuiltInAIUnavailableError(status.availability)),
    stream: stream as BuiltInAIHandle<
      TCall,
      TInput,
      TOutput,
      TStreaming
    >["stream"],
  };
}
