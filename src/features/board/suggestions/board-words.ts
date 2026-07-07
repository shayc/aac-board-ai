import { resolveButtonIntents } from "../activation/button-intent-resolver";
import type { Board } from "../types";

// Nano's context is small; a long board would blow the per-call token budget
// and slow the on-device prompt.
const MAX_BOARD_WORDS = 60;

// The words a person can tap into their message on this board. Source of truth
// is the intent resolver: compose intents exist only for buttons that add to
// the message, so the candidate set can never drift from real tap behavior.
export function getBoardWords(board: Board): string[] {
  const words: string[] = [];
  const seen = new Set<string>();

  for (const button of board.buttons) {
    for (const intent of resolveButtonIntents(button)) {
      if (intent.kind !== "compose") {
        continue;
      }

      const word = intent.content.label?.trim();
      if (!word) {
        continue;
      }

      const key = word.toLowerCase();
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      words.push(word);

      if (words.length >= MAX_BOARD_WORDS) {
        return words;
      }
    }
  }

  return words;
}
