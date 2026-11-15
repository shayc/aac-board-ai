type BoardShortcutAction = "backspace" | "clear" | "undo" | "play" | "stop";

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
  code: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

export function resolveBoardShortcut(
  event: BoardKeyEvent,
  isMessagePlaying: boolean,
): BoardShortcutAction | null {
  if (event.metaKey || event.ctrlKey) {
    if (event.key === "Enter") {
      return isMessagePlaying ? null : "play";
    }

    if (event.key === "Backspace") {
      return "clear";
    }

    // With Shift the keys mean redo, which the board does not have. Windows
    // reports AltGr, which types a letter, as Ctrl with Alt.
    if (isZKey(event) && !event.shiftKey && !event.altKey) {
      return "undo";
    }

    return null;
  }

  if (event.key === "Escape") {
    return isMessagePlaying ? "stop" : null;
  }

  if (event.key === "Backspace") {
    return "backspace";
  }

  return null;
}

// A layout without Latin letters, such as Hebrew or Arabic, produces its own
// letter for the key, so its position stands in. A Latin layout that moves Z,
// such as German, keeps its own letter.
function isZKey(event: BoardKeyEvent): boolean {
  const isLatinLetter = /^[a-z]$/i.test(event.key);

  return isLatinLetter
    ? event.key.toLowerCase() === "z"
    : event.code === "KeyZ";
}
