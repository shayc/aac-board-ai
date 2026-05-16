export type AvailabilityState =
  | "unsupported"
  | "unavailable"
  | "downloadable"
  | "downloading"
  | "available";

export interface BuiltInAIStatus {
  /** Lifecycle state of the underlying on-device model. */
  availability: AvailabilityState;
  /** Download progress in the `[0, 1]` range. `1` once the model is ready. */
  progress: number;
}

/**
 * Structural view of the static side every Built-in AI global exposes
 * (`Translator`, `Rewriter`, `Proofreader`, …). The concrete option/result
 * types come from `@types/dom-chromium-ai` and are never redeclared here.
 */
export interface BuiltInAIStatic<TCreate> {
  create(
    options: TCreate & {
      signal?: AbortSignal;
      monitor?: (monitor: CreateMonitor) => void;
    },
  ): Promise<DestroyableModel>;
  availability(options?: unknown): Promise<Availability>;
}
