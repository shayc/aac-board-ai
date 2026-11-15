type BoardShortcutAction =
  | { kind: "backspace" }
  | { kind: "clear" }
  | { kind: "play" }
  | { kind: "stop" };

/**
 * `aria-keyshortcuts` values for the controls whose action a shortcut runs.
 * Clearing has none: the attribute names keys that activate an element, and
 * the backspace button clears only on a long press.
 */
export const BOARD_SHORTCUT_ARIA_KEYS = {
  backspace: "Backspace",
  play: "Meta+Enter Control+Enter",
  stop: "Escape",
} as const;

export interface BoardKeyEvent {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
}

export function resolveBoardShortcut(
  event: BoardKeyEvent,
  isMessagePlaying: boolean,
): BoardShortcutAction | null {
  if (event.metaKey || event.ctrlKey) {
    if (event.key === "Enter") {
      return isMessagePlaying ? null : { kind: "play" };
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
