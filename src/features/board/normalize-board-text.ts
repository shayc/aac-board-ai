export function normalizeBoardText(
  text: string | undefined,
): string | undefined {
  // Translation lookups use source text as keys, so preserve nonblank text verbatim.
  return text?.trim() ? text : undefined;
}
