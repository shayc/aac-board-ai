import type { BuiltInAIError } from "../errors.ts";

/**
 * Lifecycle state of a built-in AI hook.
 *
 * State transitions:
 *
 * - `"unsupported"` — the global namespace is missing on this browser. Terminal.
 * - `"unavailable"` — the model reports it cannot run on this device. Terminal.
 * - `"idle"` — supported, but a model download is required before use.
 * - `"downloading"` — entered when a download begins; `progress` ticks `0 → 1`.
 * - `"ready"` — the instance is live; action methods can be called freely.
 * - `"error"` — `availability()` or `create()` rejected. Call `prepare()` to retry.
 */
export type Status =
  | "unsupported"
  | "unavailable"
  | "idle"
  | "downloading"
  | "ready"
  | "error";

/**
 * Fields shared by every built-in AI hook return value.
 *
 * Namespace-specific hooks extend this with their own action methods (such as
 * `summarize`, `translate`, …) and, where the API supports it, an
 * `inputQuota` field plus a `measureInput` method.
 *
 * Changing the hook's options destroys the current instance, aborts in-flight
 * work with `AbortError`, and re-enters this state machine.
 */
export interface BaseHookReturn {
  /** Current lifecycle state. See {@link Status}. */
  status: Status;
  /** Download progress in `[0, 1]`. Meaningful only while `status` is `"downloading"`. */
  progress: number;
  /** Last error captured by the lifecycle, or `null` while healthy. Inspect `cause` for the underlying browser rejection. */
  error: BuiltInAIError | null;
  /**
   * Drives the state machine toward `"ready"`.
   *
   * Resolves once the instance is ready, or rejects with a `BuiltInAIError`
   * subclass when the state forbids preparation (unsupported, unavailable,
   * or no user activation while a download is required). Call from a click
   * or keypress handler — never from render.
   */
  prepare: () => Promise<void>;
}

/**
 * Minimal contract a model instance must satisfy for the lifecycle to release
 * it cleanly on unmount or option change.
 *
 * @internal
 */
export interface DestroyableInstance {
  destroy?(): void;
}

/**
 * Minimal shape of a built-in AI global namespace, as consumed by the lifecycle.
 *
 * @internal
 */
export interface AINamespace<Options, Instance> {
  availability(options?: Options): Promise<Availability>;
  create(
    options?: Options & {
      signal?: AbortSignal;
      monitor?: CreateMonitorCallback;
    },
  ): Promise<Instance>;
}
