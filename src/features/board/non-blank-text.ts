export function nonBlankText(text: string | undefined): string | undefined {
  // Translation lookups key on source text, so non-blank text stays verbatim.
  return text?.trim() ? text : undefined;
}
