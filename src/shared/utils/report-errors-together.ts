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

  reportError(new AggregateError(errors, message));
}
