// The system prompt lives in `initialPrompts` so it survives session resets;
// each call's user prompt is self-contained (full message + board words) so a
// reset never drops conversational state we depend on.
export const PREDICTION_SYSTEM_PROMPT =
  "You predict the next words for a person composing a sentence by tapping " +
  "word tiles on a communication board. Given the sentence so far and the " +
  "words available on the board, reply with the 1 to 3 words that best " +
  "continue the sentence. Only use words that appear on the board — never add " +
  "connecting or filler words that are not on the board. Never complete the " +
  "whole sentence.";

// Kept short — on-device latency scales with the prompt length.
export function buildPredictionPrompt(
  messageText: string,
  boardWords: readonly string[],
): string {
  const boardWordsLine = `Board words: ${boardWords.join(", ")}`;
  const trimmed = messageText.trim();

  if (!trimmed) {
    return `${boardWordsLine}\nSentence so far: (empty)\nFirst 1 to 3 words to start a sentence:`;
  }

  return `${boardWordsLine}\nSentence so far: ${trimmed}\nNext 1 to 3 words:`;
}

export const PREDICTION_RESPONSE_SCHEMA = {
  type: "object",
  required: ["words"],
  additionalProperties: false,
  properties: {
    words: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: { type: "string" },
    },
  },
} as const;
