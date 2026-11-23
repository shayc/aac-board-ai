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

export interface BoardShortcutKeyEvent {
  key: string;
  code: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

export function resolveBoardShortcut(
  event: BoardShortcutKeyEvent,
  isMessagePlaying: boolean,
): BoardShortcutAction | null {
  if (event.metaKey || event.ctrlKey) {
    if (event.key === "Enter") {
      return isMessagePlaying ? null : "play";
    }

    if (event.key === "Backspace") {
      return "clear";
    }

    if (isUndoKey(event)) {
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

function isUndoKey(event: BoardShortcutKeyEvent): boolean {
  // Windows reports AltGr as Ctrl+Alt. Typing with it must not trigger undo.
  if (event.shiftKey || event.altKey) {
    return false;
  }

  // A layout without Latin letters, such as Hebrew, produces its own letter
  // for the key, so the key's position stands in. A Latin layout that moves
  // Z, such as German, goes by its letter.
  const isLatinLetter = /^[a-z]$/i.test(event.key);

  return isLatinLetter
    ? event.key.toLowerCase() === "z"
    : event.code === "KeyZ";
}
