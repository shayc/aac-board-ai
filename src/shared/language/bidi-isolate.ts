const LEFT_TO_RIGHT_ISOLATE = "⁦";
const FIRST_STRONG_ISOLATE = "⁨";
const POP_DIRECTIONAL_ISOLATE = "⁩";

/**
 * Keeps text of unknown direction, such as a host name or text that starts
 * with a digit, in its own order inside a sentence of either direction.
 */
export function isolateBidi(text: string): string {
  return `${FIRST_STRONG_ISOLATE}${text}${POP_DIRECTIONAL_ISOLATE}`;
}

/**
 * Keeps text left to right inside a right-to-left sentence. Symbols such as ⌘
 * and ⌫ have no direction of their own, so they would otherwise be reversed.
 */
export function isolateLTR(text: string): string {
  return `${LEFT_TO_RIGHT_ISOLATE}${text}${POP_DIRECTIONAL_ISOLATE}`;
}
