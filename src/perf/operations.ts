import type { OperationName } from "./perf-names";
import { recordOperation } from "./perf-store";

export function measureOperation<T>(name: OperationName, run: () => T): T {
  const startTime = performance.now();
  const record = () => recordOperation(name, performance.now() - startTime);

  let result: T;
  try {
    result = run();
  } catch (error) {
    record();
    throw error;
  }

  if (result instanceof Promise) {
    result.then(record, record);
  } else {
    record();
  }

  return result;
}
