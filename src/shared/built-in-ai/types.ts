import type { BuiltInAIError } from "./errors.ts";

/**
 * Lifecycle state of a built-in AI hook. Transitions: `idle` →
 * `downloading` → `ready`, or one of the terminal states `unsupported` /
 * `unavailable` / `error`.
 */
export type Status =
  | "unsupported"
  | "unavailable"
  | "idle"
  | "downloading"
  | "ready"
  | "error";

/** Fields shared by every built-in AI hook return value. */
export interface BaseHookReturn {
  /** Current lifecycle state. See {@link Status} for transitions. */
  status: Status;
  /** `0..1` while `status === "downloading"`; `0` otherwise. */
  progress: number;
  /** Last lifecycle error; inspect `.cause` for the underlying browser rejection. */
  error: BuiltInAIError | null;
  /**
   * Pre-warms the model — triggers any required download and the underlying
   * `create()` call. Invoke from a user-activation handler (click, keypress)
   * if a download may be required.
   *
   * @throws A {@link BuiltInAIError} subclass — `UnsupportedError`,
   * `UnavailableError`, `NoUserActivationError`, or `NotReadyError`.
   */
  prepare: () => Promise<void>;
}
