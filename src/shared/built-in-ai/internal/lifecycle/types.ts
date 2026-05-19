import type { BuiltInAIError } from "../../errors.ts";

/** Lifecycle state of a built-in AI hook. */
export type Status =
  | "unsupported"
  | "unavailable"
  | "idle"
  | "downloading"
  | "ready"
  | "error";

/** Fields shared by every built-in AI hook return value. */
export interface BaseHookReturn {
  status: Status;
  /** `0..1` while `status === "downloading"`; `0` otherwise. */
  progress: number;
  /** Last lifecycle error; inspect `cause` for the underlying browser rejection. */
  error: BuiltInAIError | null;
  /** Drives the state machine toward `"ready"`. Call from a user-activation handler. */
  prepare: () => Promise<void>;
}

/** @internal */
export interface DestroyableInstance {
  destroy?(): void;
}

/** @internal */
export interface AINamespace<Options, Instance> {
  availability(options?: Options): Promise<Availability>;
  create(
    options?: Options & {
      signal?: AbortSignal;
      monitor?: CreateMonitorCallback;
    },
  ): Promise<Instance>;
}
