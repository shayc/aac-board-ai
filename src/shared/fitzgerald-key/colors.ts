import type { FitzgeraldCategory, FitzgeraldColor } from "./types";

/** Modified Fitzgerald Key color palette for AAC. */
export const fitzgeraldColors: Record<FitzgeraldCategory, FitzgeraldColor> = {
  verb: { name: "Green", color: "#27AE60" },
  noun: { name: "Orange", color: "#F2994A" },
  pronoun: { name: "Yellow", color: "#F2C94C" },
  adjective: { name: "Blue", color: "#2F80ED" },
  question: { name: "Purple", color: "#9B51E0" },
  social: { name: "Pink", color: "#FF69B4" },
  negation: { name: "Red", color: "#EB5757" },
  adverb: { name: "Brown", color: "#8D6E63" },
  preposition: { name: "Pink", color: "#FF69B4" },
  conjunction: { name: "White", color: "#FFFFFF" },
  determiner: { name: "Grey", color: "#BDBDBD" },
  miscellaneous: { name: "White", color: "#FFFFFF" },
};
