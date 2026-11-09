import type { StringTranslations } from "../board-types";

export async function translateStrings(
  strings: Iterable<string>,
  translator: Translator,
  signal: AbortSignal,
): Promise<StringTranslations> {
  const entries = await Promise.all(
    Array.from(strings, async (text) => {
      const translated = await translator.translate(text, { signal });

      return [text, translated] as const;
    }),
  );

  return new Map(entries);
}
