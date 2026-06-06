const UNDERSCORED_WORD = /\b[A-Za-z]+_[A-Za-z]+\b/;

function isClean(phrase: string): boolean {
  return !UNDERSCORED_WORD.test(phrase) && !phrase.includes('"');
}

function normalize(phrase: string): string {
  return phrase.trim().toLowerCase();
}

export function toPhrases(
  text: string,
  candidates: readonly (string | undefined)[],
): string[] {
  const seen = new Set<string>([normalize(text)]);

  return candidates.filter((candidate): candidate is string => {
    if (!candidate || !isClean(candidate)) {
      return false;
    }
    const key = normalize(candidate);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
