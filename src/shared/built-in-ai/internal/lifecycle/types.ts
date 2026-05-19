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
