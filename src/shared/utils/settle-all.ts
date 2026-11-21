interface Settled<T> {
  values: T[];
  errors: unknown[];
}

/**
 * Waits for every promise and never rejects: the values that fulfilled keep
 * their order, and each rejection comes back as an error.
 */
export async function settleAll<T>(
  promises: Iterable<Promise<T>>,
): Promise<Settled<T>> {
  const values: T[] = [];
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
