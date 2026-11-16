export function parseOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
