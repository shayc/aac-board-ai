/**
 * Modified Fitzgerald Key (MFK) — Grammatical categories and color definitions
 * for AAC communication boards.
 *
 * The MFK maps grammatical function to specific colors, enabling users to
 * visually scan boards by part-of-speech. This module defines the canonical
 * category taxonomy and the color contract used throughout the application.
 */

/**
 * Grammatical categories recognized by the Modified Fitzgerald Key.
 *
 * Includes both syntactic parts-of-speech (verb, noun, …) and pragmatic
 * categories (question, social, negation) that override standard POS tagging
 * in AAC contexts.
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

/**
 * Color definition for a single Fitzgerald Key category.
 *
 * `borderColor` is the full-saturation category color (used for button borders).
 * `backgroundColor` is a desaturated ("bleached") tint derived from the border
 * color (~20 % opacity over white), used as the button fill.
 */
export interface FitzgeraldColor {
  /** Human-readable color name (e.g. "Green", "Orange"). */
  name: string;
  /** Full-saturation hex color for borders. */
  borderColor: string;
  /** Bleached (desaturated) hex color for button backgrounds. */
  backgroundColor: string;
}
