export interface TabFocusTracker {
  /** Whether `target` holds focus because the user moved there with Tab. */
  isTabFocused: (target: EventTarget | null) => boolean;
  stop: () => void;
}

/**
 * Tracks whether focus was last moved with the Tab key. A switch never sends
 * Tab, so Tab-moved focus means someone is using the keyboard as a keyboard.
 * Focus that arrives any other way (a tap, a closing drawer restoring focus)
 * does not count.
 */
export function trackTabFocus(): TabFocusTracker {
  let isTabDown = false;
  let tabFocused: EventTarget | null = null;

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Tab") {
      isTabDown = true;
    }
  }

  function handleKeyUp(event: KeyboardEvent) {
    if (event.key === "Tab") {
      isTabDown = false;
    }
  }

  function handleFocusIn(event: FocusEvent) {
    tabFocused = isTabDown ? event.target : null;
  }

  document.addEventListener("keydown", handleKeyDown, { capture: true });
  document.addEventListener("keyup", handleKeyUp, { capture: true });
  document.addEventListener("focusin", handleFocusIn, { capture: true });

  return {
    isTabFocused: (target) => target !== null && target === tabFocused,
    stop() {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.removeEventListener("keyup", handleKeyUp, { capture: true });
      document.removeEventListener("focusin", handleFocusIn, { capture: true });
    },
  };
}
