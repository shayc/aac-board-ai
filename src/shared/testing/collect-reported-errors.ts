import { onTestFinished } from "vitest";

/**
 * Collects what the code under test passes to `reportError` and marks each as
 * handled, so an error a test expects does not fail the run.
 */
export function collectReportedErrors(): unknown[] {
  const reportedErrors: unknown[] = [];
  const controller = new AbortController();
  onTestFinished(() => controller.abort());

  window.addEventListener(
    "error",
    (event) => {
      reportedErrors.push(event.error);
      event.preventDefault();
    },
    { signal: controller.signal },
  );

  return reportedErrors;
}
