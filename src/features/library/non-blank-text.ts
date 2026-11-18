export function nonBlankText(text: string | undefined): string | undefined {
  // Translation lookups use source text as keys, so nonblank text is kept verbatim.
  return text?.trim() ? text : undefined;
}
