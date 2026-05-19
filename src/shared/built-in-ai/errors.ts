/**
 * Base class for every error thrown by the lifecycle layer of this package.
 *
 * Use `instanceof BuiltInAIError` to distinguish library-thrown errors from
 * browser API rejections (e.g. `AbortError`) that pass through unchanged.
 */
export class BuiltInAIError extends Error {
  override name = "BuiltInAIError";
}

export class UnsupportedError extends BuiltInAIError {
  override name = "UnsupportedError";
  constructor(
    message = "Built-in AI is not supported",
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export class UnavailableError extends BuiltInAIError {
  override name = "UnavailableError";
  constructor(
    message = "Built-in AI model is unavailable",
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export class NoUserActivationError extends BuiltInAIError {
  override name = "NoUserActivationError";
  constructor(
    message = "Built-in AI requires a user activation to download",
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export class NotReadyError extends BuiltInAIError {
  override name = "NotReadyError";
  constructor(cause?: unknown) {
    super("Built-in AI is in an error state", { cause });
  }
}
