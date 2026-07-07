const MAX_PREDICTION_WORDS = 3;

export interface ToPredictedWordsInput {
  rawResponse: string;
  boardWords: readonly string[];
}

// Map the model's words back to the board's casing, keeping only on-board words.
export function toPredictedWords({
  rawResponse,
  boardWords,
}: ToPredictedWordsInput): string[] {
  const { words } = JSON.parse(rawResponse) as { words: string[] };
  const canonical = new Map(
    boardWords.map((word) => [word.toLowerCase(), word]),
  );

  return words
    .map((word) => canonical.get(word.toLowerCase()))
    .filter((word): word is string => word !== undefined)
    .slice(0, MAX_PREDICTION_WORDS);
}
