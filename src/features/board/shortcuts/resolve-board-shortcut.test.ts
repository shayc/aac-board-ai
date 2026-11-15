import { describe, expect, test } from "vitest";
import {
  BOARD_SHORTCUT_ARIA_KEYS,
  type BoardKeyEvent,
  resolveBoardShortcut,
} from "./resolve-board-shortcut";

function keyEvent(overrides: Partial<BoardKeyEvent>): BoardKeyEvent {
  return {
    key: "",
    code: "",
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...overrides,
  };
}

describe("resolveBoardShortcut", () => {
  test("Backspace resolves to the backspace action", () => {
    expect(resolveBoardShortcut(keyEvent({ key: "Backspace" }), false)).toBe(
      "backspace",
    );
  });

  test("⌘/Ctrl+Backspace clears the message", () => {
    expect(
      resolveBoardShortcut(
        keyEvent({ key: "Backspace", metaKey: true }),
        false,
      ),
    ).toBe("clear");
    expect(
      resolveBoardShortcut(
        keyEvent({ key: "Backspace", ctrlKey: true }),
        false,
      ),
    ).toBe("clear");
  });

  test("⌘/Ctrl+Z undoes, in either letter case", () => {
    expect(
      resolveBoardShortcut(keyEvent({ key: "z", metaKey: true }), false),
    ).toBe("undo");
    expect(
      resolveBoardShortcut(keyEvent({ key: "Z", ctrlKey: true }), false),
    ).toBe("undo");
  });

  test("⌘/Ctrl with the Z key undoes on a layout without Latin letters", () => {
    expect(
      resolveBoardShortcut(
        keyEvent({ key: "ז", code: "KeyZ", ctrlKey: true }),
        false,
      ),
    ).toBe("undo");
  });

  test("⌘/Ctrl+Z goes by the letter on a Latin layout that moves Z", () => {
    expect(
      resolveBoardShortcut(
        keyEvent({ key: "y", code: "KeyZ", ctrlKey: true }),
        false,
      ),
    ).toBeNull();
    expect(
      resolveBoardShortcut(
        keyEvent({ key: "z", code: "KeyY", ctrlKey: true }),
        false,
      ),
    ).toBe("undo");
  });

  test("⌘/Ctrl+Shift+Z, the redo keys, are not claimed", () => {
    expect(
      resolveBoardShortcut(
        keyEvent({ key: "Z", metaKey: true, shiftKey: true }),
        false,
      ),
    ).toBeNull();
  });

  test("a letter typed with AltGr on the Z key is not claimed", () => {
    expect(
      resolveBoardShortcut(
        keyEvent({ key: "ż", code: "KeyZ", ctrlKey: true, altKey: true }),
        false,
      ),
    ).toBeNull();
  });

  test("⌘/Ctrl+Enter plays only while idle", () => {
    expect(
      resolveBoardShortcut(keyEvent({ key: "Enter", metaKey: true }), false),
    ).toBe("play");
    expect(
      resolveBoardShortcut(keyEvent({ key: "Enter", ctrlKey: true }), false),
    ).toBe("play");
    expect(
      resolveBoardShortcut(keyEvent({ key: "Enter", metaKey: true }), true),
    ).toBeNull();
  });

  test("Escape stops only while playing", () => {
    expect(resolveBoardShortcut(keyEvent({ key: "Escape" }), true)).toBe(
      "stop",
    );
    expect(resolveBoardShortcut(keyEvent({ key: "Escape" }), false)).toBeNull();
  });

  test("Enter without a modifier is left for the focused control", () => {
    expect(resolveBoardShortcut(keyEvent({ key: "Enter" }), false)).toBeNull();
  });

  test("does not claim printable keys", () => {
    for (const typed of ["h", "5", "!", " "]) {
      expect(resolveBoardShortcut(keyEvent({ key: typed }), false)).toBeNull();
    }
  });

  test("⌘/Ctrl combos the board doesn't use pass through to the browser", () => {
    expect(
      resolveBoardShortcut(keyEvent({ key: "c", metaKey: true }), false),
    ).toBeNull();
    expect(
      resolveBoardShortcut(keyEvent({ key: "r", ctrlKey: true }), false),
    ).toBeNull();
  });

  test("navigation and other named keys are ignored", () => {
    for (const named of ["ArrowUp", "ArrowDown", "Home", "End", "Tab", "F1"]) {
      expect(resolveBoardShortcut(keyEvent({ key: named }), false)).toBeNull();
    }
  });

  test.each(Object.entries(BOARD_SHORTCUT_ARIA_KEYS))(
    "every combination aria-keyshortcuts names for %s runs that action",
    (expectedAction, ariaKeyShortcuts) => {
      const isMessagePlaying = expectedAction === "stop";

      const actions = ariaKeyShortcuts
        .split(" ")
        .map((combination) =>
          resolveBoardShortcut(parseCombination(combination), isMessagePlaying),
        );

      for (const action of actions) {
        expect(action).toBe(expectedAction);
      }
    },
  );
});

function parseCombination(combination: string): BoardKeyEvent {
  const keys = combination.split("+");

  return keyEvent({
    key: keys.at(-1),
    metaKey: keys.includes("Meta"),
    ctrlKey: keys.includes("Control"),
  });
}
