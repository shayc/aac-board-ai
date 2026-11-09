export async function translateStrings(
  strings: Iterable<string>,
  translator: Translator,
  signal: AbortSignal,
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    Array.from(strings, async (text) => {
      const translated = await translator.translate(text, { signal });

      return [text, translated] as const;
    }),
  );

  return Object.fromEntries(entries);
}
