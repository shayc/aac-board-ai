import type { BuiltInAIName } from "../../is-supported";

/** @internal */
export interface AINamespace<Options, Model extends DestroyableModel> {
  availability(options?: Options): Promise<Availability>;
  create(
    options?: Options & {
      signal?: AbortSignal;
      monitor?: CreateMonitorCallback;
    },
  ): Promise<Model>;
}

/** @internal */
export function getNamespace<Options, Model extends DestroyableModel>(
  name: BuiltInAIName,
): AINamespace<Options, Model> | undefined {
  return (globalThis as Record<string, unknown>)[name] as
    | AINamespace<Options, Model>
    | undefined;
}
