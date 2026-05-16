import type { BuiltInAIStatic } from "./types";

/**
 * The entire per-API variance, expressed as data. `TStreaming` is a phantom
 * type parameter carried only to gate the handle's `stream` member at the
 * type level (present for streaming APIs, `undefined` otherwise).
 */
export interface BuiltInAIModel<
  TCreate,
  TCall,
  TInput,
  TOutput,
  TStreaming extends boolean,
> {
  /** Phantom — carries the streaming capability into the type system so the
   *  handle's `stream` member can be gated. Never assigned at runtime. */
  readonly __streaming?: TStreaming;
  /** Global name — drives feature detection and the registry key prefix. */
  readonly name: string;
  /** Resolve the platform static handle, or `undefined` when unsupported. */
  resolve(): BuiltInAIStatic<TCreate> | undefined;
  /** Arguments passed to `availability()` (defaults to the options as-is). */
  availabilityArgs(options: TCreate): unknown;
  /** Stable reuse key — same key reuses the same instance. */
  identity(options: TCreate): string;
  /** Canonicalize options before `create()` (e.g. locale normalization). */
  normalize(options: TCreate): TCreate;
  defaults?: Partial<TCreate>;
  /** The domain call — closes over the verb, keeping types intact. */
  run: (instance: unknown, input: TInput, options?: TCall) => Promise<TOutput>;
  /** Present iff the API supports streaming. */
  stream?: (
    instance: unknown,
    input: TInput,
    options?: TCall,
  ) => ReadableStream<string>;
}

type ModelSpec<
  TCreate,
  TCall,
  TInput,
  TOutput,
  TStreaming extends boolean,
> = Pick<
  BuiltInAIModel<TCreate, TCall, TInput, TOutput, TStreaming>,
  "name" | "run"
> &
  Partial<BuiltInAIModel<TCreate, TCall, TInput, TOutput, TStreaming>>;

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
  return `{${entries.join(",")}}`;
}

/**
 * Builds a descriptor, filling in conventional defaults so concrete
 * descriptors stay tiny: feature-detected `resolve`, identity `normalize`,
 * options-as-is `availabilityArgs`, and an order-independent `identity`.
 */
export function defineModel<
  TCreate,
  TCall,
  TInput,
  TOutput,
  TStreaming extends boolean = false,
>(
  spec: ModelSpec<TCreate, TCall, TInput, TOutput, TStreaming>,
): BuiltInAIModel<TCreate, TCall, TInput, TOutput, TStreaming> {
  const { name } = spec;

  return {
    name,
    resolve:
      spec.resolve ??
      (() => {
        const globals = globalThis as Record<string, unknown>;
        return name in globals
          ? (globals[name] as BuiltInAIStatic<TCreate>)
          : undefined;
      }),
    availabilityArgs: spec.availabilityArgs ?? ((options) => options),
    identity: spec.identity ?? ((options) => stableStringify(options)),
    normalize: spec.normalize ?? ((options) => options),
    defaults: spec.defaults,
    run: spec.run,
    stream: spec.stream,
  };
}
