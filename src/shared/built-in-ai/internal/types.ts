export type Status =
  | "unsupported"
  | "unavailable"
  | "idle"
  | "downloading"
  | "ready"
  | "error";

export interface BaseHookReturn {
  status: Status;
  progress: number;
  error: Error | null;
  prepare: () => Promise<void>;
}

export interface DestroyableInstance {
  destroy?(): void;
}

export interface AINamespace<Options, Instance> {
  availability(options?: Options): Promise<Availability>;
  create(
    options?: Options & {
      signal?: AbortSignal;
      monitor?: CreateMonitorCallback;
    },
  ): Promise<Instance>;
}
