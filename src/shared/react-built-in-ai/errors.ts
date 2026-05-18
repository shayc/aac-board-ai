export class BuiltInAIError extends Error {
  override name = "BuiltInAIError";
}

export class UnsupportedError extends BuiltInAIError {
  override name = "UnsupportedError";
}

export class UnavailableError extends BuiltInAIError {
  override name = "UnavailableError";
}

export class NoUserActivationError extends BuiltInAIError {
  override name = "NoUserActivationError";
}

export class NotReadyError extends BuiltInAIError {
  override name = "NotReadyError";
}
