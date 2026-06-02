const UNDERSCORED_WORD = /\b[A-Za-z]+_[A-Za-z]+\b/;

function isClean(phrase: string): boolean {
  return !UNDERSCORED_WORD.test(phrase) && !phrase.includes('"');
}

export function toPhrases(
  text: string,
  candidates: readonly (string | undefined)[],
): string[] {
  const phrases = new Set<string>();

  for (const candidate of candidates) {
    if (candidate && candidate !== text && isClean(candidate)) {
      phrases.add(candidate);
    }
  }

  return [...phrases];
}
