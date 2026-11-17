/**
 * Reports the errors of one operation as a single error, because one fault
 * that fails every step would otherwise be reported once per step. Reports
 * nothing when there are none.
 */
export function reportErrorsTogether(
  errors: readonly unknown[],
  message: string,
): void {
  if (errors.length === 0) {
    return;
  }

  // The console prints only an uncaught error's own message, so the first
  // cause is named there; the rest stay on `errors`.
  const firstError = errors[0];

  reportError(
    new AggregateError(errors, `${message}: ${String(firstError)}`, {
      cause: firstError,
    }),
  );
}
