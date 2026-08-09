type BoardKeyAction =
  | { kind: "backspace" }
  | { kind: "clear" }
  | { kind: "speak" }
  | { kind: "stop" };

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
  isMessagePlaying: boolean,
): BoardKeyAction | null {
  if (event.metaKey || event.ctrlKey) {
    if (event.key === "Enter") {
      return isMessagePlaying ? null : { kind: "speak" };
    }

    if (event.key === "Backspace") {
      return { kind: "clear" };
    }

    return null;
  }

  if (event.key === "Escape") {
    return isMessagePlaying ? { kind: "stop" } : null;
  }

  if (event.key === "Backspace") {
    return { kind: "backspace" };
  }

  return null;
}
