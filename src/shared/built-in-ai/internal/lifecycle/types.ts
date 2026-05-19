import type { BuiltInAIName } from "../../is-supported.ts";

/** @internal */
export interface AINamespace<Options, Instance extends DestroyableModel> {
  availability(options?: Options): Promise<Availability>;
  create(
    options?: Options & {
      signal?: AbortSignal;
      monitor?: CreateMonitorCallback;
    },
  ): Promise<Instance>;
}

/** @internal */
export function getNamespace<Options, Instance extends DestroyableModel>(
  name: BuiltInAIName,
): AINamespace<Options, Instance> | undefined {
  return (globalThis as Record<string, unknown>)[name] as
    | AINamespace<Options, Instance>
    | undefined;
}
