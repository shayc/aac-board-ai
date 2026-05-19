/**
 * Base class for every error thrown by this package's lifecycle. Use
 * `instanceof BuiltInAIError` to separate library errors from browser API
 * rejections (e.g. `AbortError`) that pass through unchanged.
 */
export class BuiltInAIError extends Error {
  override name = "BuiltInAIError";
}

/** The built-in AI namespace (`Translator`, `Rewriter`, `Proofreader`) is not on `globalThis`. */
export class UnsupportedError extends BuiltInAIError {
  override name = "UnsupportedError";
  constructor(
    message = "Built-in AI is not supported",
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

/** `availability()` reported the model can't run on this device. */
export class UnavailableError extends BuiltInAIError {
  override name = "UnavailableError";
  constructor(
    message = "Built-in AI model is unavailable",
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

/** A download was required but no transient user activation was present. */
export class NoUserActivationError extends BuiltInAIError {
  override name = "NoUserActivationError";
  constructor(
    message = "Built-in AI requires a user activation to download",
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

/** A prior `create()` rejected. Inspect `.cause` for the underlying browser rejection. */
export class NotReadyError extends BuiltInAIError {
  override name = "NotReadyError";
  constructor(cause?: unknown) {
    super("Built-in AI is in an error state", { cause });
  }
}
