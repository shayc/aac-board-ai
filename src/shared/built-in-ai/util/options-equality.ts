export function shallowEqualOptions<T extends object>(
  a: T | undefined,
  b: T | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) {
    return false;
  }
  const ar = a as Record<string, unknown>;
  const br = b as Record<string, unknown>;
  for (const k of keys) {
    if (!Object.is(ar[k], br[k])) {
      return false;
    }
  }
  return true;
}
