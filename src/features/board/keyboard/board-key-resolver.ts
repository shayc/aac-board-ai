export type BoardKeyAction =
  | { kind: "backspace" }
  | { kind: "clear" }
  | { kind: "speak" }
  | { kind: "cancel" };

export interface KeyEventLike {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
}

/**
 * Resolves a keystroke to a board action, or `null` when the board doesn't
 * claim the key — so the caller leaves it be: Enter and Space keep activating
 * the focused control, and ⌘/Ctrl combos reach the browser.
 */
export function resolveBoardKey(
  event: KeyEventLike,
  isSpeaking: boolean,
): BoardKeyAction | null {
  if (event.metaKey || event.ctrlKey) {
    if (event.key === "Enter") {
      // While speaking, ⌘+Enter is inert — don't stack a second playback.
      return isSpeaking ? null : { kind: "speak" };
    }
    if (event.key === "Backspace") {
      return { kind: "clear" };
    }
    return null;
  }

  if (event.key === "Escape") {
    return isSpeaking ? { kind: "cancel" } : null;
  }
  if (event.key === "Backspace") {
    return { kind: "backspace" };
  }

  return null;
}
