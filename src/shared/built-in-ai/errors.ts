/**
 * Base class for every error thrown by the lifecycle layer of this package.
 *
 * Use `instanceof BuiltInAIError` to distinguish library-thrown gating errors
 * from rejections that pass through from the browser's underlying API (such as
 * an `AbortError` `DOMException` raised by a `signal`).
 *
 * When the lifecycle settles into the `"error"` state by wrapping a browser
 * rejection, the original error is preserved as `cause`.
 *
 * @example
 * ```ts
 * try {
 *   await summarizer.summarize(text);
 * } catch (error) {
 *   if (error instanceof BuiltInAIError) {
 *     // Lifecycle gating: render a fallback.
 *   } else {
 *     // Browser API rejection (e.g. AbortError) — re-throw or handle directly.
 *     throw error;
 *   }
 * }
 * ```
 */
export class BuiltInAIError extends Error {
  override name = "BuiltInAIError";
}

/**
 * The global namespace for this built-in AI feature is not defined on the host.
 *
 * Thrown when the browser does not implement the requested API (e.g. running
 * outside Chrome/Edge, or behind a flag that is currently off). The condition
 * is terminal: no retry can recover from it. Feature-detect with
 * {@link isSupported} and render a fallback UI.
 */
export class UnsupportedError extends BuiltInAIError {
  override name = "UnsupportedError";
}

/**
 * The API exists but reports it cannot run on this device.
 *
 * Thrown when `availability()` resolves to `"unavailable"` — typically due to
 * insufficient hardware, disk space, or policy. The condition is terminal for
 * this session: do not retry; render a fallback UI.
 */
export class UnavailableError extends BuiltInAIError {
  override name = "UnavailableError";
}

/**
 * A model download is required, but no user activation is currently active.
 *
 * Browsers require a transient user activation (a click, keypress, etc.) to
 * authorize downloading the model. Trigger {@link BaseHookReturn.prepare} — or
 * the first action method — from an event handler, not during render or in a
 * timer/promise that has lost the activation.
 */
export class NoUserActivationError extends BuiltInAIError {
  override name = "NoUserActivationError";
}

/**
 * The lifecycle is in its `"error"` state because a prior `create()` rejected.
 *
 * Inspect `cause` for the underlying browser rejection. To recover, call
 * {@link BaseHookReturn.prepare} from a user activation to retry the full
 * `availability → create` chain.
 */
export class NotReadyError extends BuiltInAIError {
  override name = "NotReadyError";
}
