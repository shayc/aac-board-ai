/**
 * Modified Fitzgerald Key grammatical categories.
 *
 * Includes standard parts-of-speech and pragmatic categories (question, social,
 * negation) that override POS tagging in AAC contexts.
 */
export type FitzgeraldCategory =
  | "verb"
  | "noun"
  | "pronoun"
  | "adjective"
  | "question"
  | "social"
  | "negation"
  | "adverb"
  | "preposition"
  | "conjunction"
  | "determiner"
  | "miscellaneous";

/** Color assigned to a Fitzgerald Key category. */
export interface FitzgeraldColor {
  /** Color name (e.g. "Green", "Orange"). */
  name: string;
  /** Hex color value. */
  color: string;
}
