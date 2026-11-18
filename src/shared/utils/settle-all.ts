interface Settled<Value> {
  values: Value[];
  errors: unknown[];
}

/**
 * Waits for every promise and never rejects: the values that fulfilled keep
 * their order, and each rejection comes back as an error.
 */
export async function settleAll<Value>(
  promises: Iterable<Promise<Value>>,
): Promise<Settled<Value>> {
  const values: Value[] = [];
  const errors: unknown[] = [];

  for (const result of await Promise.allSettled(promises)) {
    if (result.status === "fulfilled") {
      values.push(result.value);
    } else {
      errors.push(result.reason);
    }
  }

  return { values, errors };
}
