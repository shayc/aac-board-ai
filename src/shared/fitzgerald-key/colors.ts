import type { FitzgeraldCategory, FitzgeraldColor } from "./types";

/**
 * Modified Fitzgerald Key — Digital/UI Standard palette.
 *
 * Border colors are the canonical full-saturation hues reconciled across major
 * AAC platforms (Proloquo2Go, Boardmaker, CoughDrop). Background colors are
 * "bleached" tints (~20 % of the border color mixed with white) optimized for
 * screen readability and WCAG 2.1 AA contrast with dark text.
 */
export const fitzgeraldColors: Record<FitzgeraldCategory, FitzgeraldColor> = {
  verb: {
    name: "Green",
    borderColor: "#27AE60",
    backgroundColor: "#D4EFDF",
  },
  noun: {
    name: "Orange",
    borderColor: "#F2994A",
    backgroundColor: "#FDEBD0",
  },
  pronoun: {
    name: "Yellow",
    borderColor: "#F2C94C",
    backgroundColor: "#FCF3CF",
  },
  adjective: {
    name: "Blue",
    borderColor: "#2F80ED",
    backgroundColor: "#D6EAF8",
  },
  question: {
    name: "Purple",
    borderColor: "#9B51E0",
    backgroundColor: "#EBDEF0",
  },
  social: {
    name: "Pink",
    borderColor: "#FF69B4",
    backgroundColor: "#FADBD8",
  },
  negation: {
    name: "Red",
    borderColor: "#EB5757",
    backgroundColor: "#F9E1E1",
  },
  adverb: {
    name: "Brown",
    borderColor: "#8D6E63",
    backgroundColor: "#F4F0EF",
  },
  preposition: {
    name: "Pink",
    borderColor: "#FF69B4",
    backgroundColor: "#FADBD8",
  },
  conjunction: {
    name: "White",
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
  },
  determiner: {
    name: "Grey",
    borderColor: "#BDBDBD",
    backgroundColor: "#F2F2F2",
  },
  miscellaneous: {
    name: "White",
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
  },
};
