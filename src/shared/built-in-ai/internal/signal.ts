export function abortError(reason?: unknown): DOMException {
  return reason instanceof DOMException && reason.name === "AbortError"
    ? reason
    : new DOMException(
        typeof reason === "string" ? reason : "Aborted",
        "AbortError",
      );
}

function toError(reason: unknown): Error {
  return reason instanceof Error ? reason : abortError(reason);
}

export function mergeSignals(
  ...signals: readonly (AbortSignal | undefined)[]
): AbortSignal {
  const present = signals.filter((s) => s instanceof AbortSignal);
  return present.length === 1 ? present[0] : AbortSignal.any(present);
}

export function raceAbort<T>(
  promise: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  if (signal.aborted) {
    return Promise.reject(toError(signal.reason));
  }
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(toError(signal.reason));
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (v) => {
        signal.removeEventListener("abort", onAbort);
        resolve(v);
      },
      (e: unknown) => {
        signal.removeEventListener("abort", onAbort);
        reject(toError(e));
      },
    );
  });
}
