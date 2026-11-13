const UNDERSCORED_WORD = /\b[A-Za-z]+_[A-Za-z]+\b/;
// Latin, CJK (ideographic, fullwidth, halfwidth), and Devanagari/Bengali danda.
const FINAL_FULL_STOP = /[.。．｡।]$/;

export function selectSuggestionPhrases(
  text: string,
  candidates: readonly (string | undefined)[],
): string[] {
  const seen = new Set<string>([normalize(text)]);
  const phrases: string[] = [];

  for (const candidate of candidates) {
    if (!candidate || hasArtifacts(candidate)) {
      continue;
    }

    const key = normalize(candidate);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    phrases.push(candidate);
  }

  return phrases;
}

function hasArtifacts(phrase: string): boolean {
  return UNDERSCORED_WORD.test(phrase) || phrase.includes('"');
}

function normalize(phrase: string): string {
  return phrase.trim().replace(FINAL_FULL_STOP, "").trimEnd().toLowerCase();
}
