const SURROUNDING_NON_WORD = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

function normalizeWord(word: string): string {
  return word.trim().replace(SURROUNDING_NON_WORD, "");
}

const MAX_PREDICTION_WORDS = 3;

export interface ToPredictionInput {
  raw: string;
  boardWords: readonly string[];
  messageText: string;
}

// The model sometimes echoes the last typed word ("I want" → "want more").
function dropLeadingDuplicate(words: string[], messageText: string): string[] {
  const lastWord = messageText.trim().split(/\s+/).at(-1)?.toLowerCase();
  if (!lastWord || words.length === 0) {
    return words;
  }

  return words[0].toLowerCase() === lastWord ? words.slice(1) : words;
}

// Turns raw model output into a validated word list. The model is never
// trusted: output is parsed, then each word is matched against the board words
// (case-insensitively). The first word that isn't on the board truncates the
// rest (later words were predicted on top of the invalid one), so an empty
// result means nothing to suggest.
export function toPrediction({
  raw,
  boardWords,
  messageText,
}: ToPredictionInput): string[] {
  const rawWords = parseWords(raw);
  if (!rawWords) {
    return [];
  }

  const canonicalWords = new Map<string, string>();
  for (const word of boardWords) {
    const key = word.toLowerCase();
    if (!canonicalWords.has(key)) {
      canonicalWords.set(key, word);
    }
  }

  // Strip the echoed last word before validation — otherwise, if it isn't on
  // the current board, it would truncate the whole prediction before it starts.
  const words = dropLeadingDuplicate(rawWords.map(normalizeWord), messageText);

  const accepted: string[] = [];

  for (const word of words) {
    const boardWord = canonicalWords.get(word.toLowerCase());
    if (!boardWord) {
      break;
    }

    accepted.push(boardWord);
    if (accepted.length === MAX_PREDICTION_WORDS) {
      break;
    }
  }

  return accepted;
}

function parseWords(raw: string): string[] | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as { words?: unknown }).words)
  ) {
    return undefined;
  }

  const { words } = parsed as { words: unknown[] };
  if (!words.every((word) => typeof word === "string")) {
    return undefined;
  }

  return words;
}
