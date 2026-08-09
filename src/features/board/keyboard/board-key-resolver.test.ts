import { describe, expect, test } from "vitest";
import { resolveBoardKey, type KeyEventLike } from "./board-key-resolver";

function key(overrides: Partial<KeyEventLike>): KeyEventLike {
  return { key: "", metaKey: false, ctrlKey: false, ...overrides };
}

describe("resolveBoardKey", () => {
  test("Backspace applies message backspace behavior", () => {
    expect(resolveBoardKey(key({ key: "Backspace" }), false)).toEqual({
      kind: "backspace",
    });
  });

  test("⌘/Ctrl+Backspace clears the message", () => {
    expect(
      resolveBoardKey(key({ key: "Backspace", metaKey: true }), false),
    ).toEqual({
      kind: "clear",
    });
    expect(
      resolveBoardKey(key({ key: "Backspace", ctrlKey: true }), false),
    ).toEqual({
      kind: "clear",
    });
  });

  test("⌘/Ctrl+Enter speaks, but is inert while already speaking", () => {
    expect(
      resolveBoardKey(key({ key: "Enter", metaKey: true }), false),
    ).toEqual({
      kind: "speak",
    });
    expect(
      resolveBoardKey(key({ key: "Enter", ctrlKey: true }), false),
    ).toEqual({
      kind: "speak",
    });
    expect(
      resolveBoardKey(key({ key: "Enter", metaKey: true }), true),
    ).toBeNull();
  });

  test("Escape cancels only while speaking", () => {
    expect(resolveBoardKey(key({ key: "Escape" }), true)).toEqual({
      kind: "stop",
    });
    expect(resolveBoardKey(key({ key: "Escape" }), false)).toBeNull();
  });

  test("Enter without a modifier is left for the focused control", () => {
    expect(resolveBoardKey(key({ key: "Enter" }), false)).toBeNull();
  });

  test("typing keys are not yet claimed — spelling comes later", () => {
    for (const typed of ["h", "5", "!", " "]) {
      expect(resolveBoardKey(key({ key: typed }), false)).toBeNull();
    }
  });

  test("⌘/Ctrl combos the board doesn't use pass through to the browser", () => {
    expect(resolveBoardKey(key({ key: "c", metaKey: true }), false)).toBeNull();
    expect(resolveBoardKey(key({ key: "r", ctrlKey: true }), false)).toBeNull();
  });

  test("navigation and other named keys are ignored", () => {
    for (const named of ["ArrowUp", "ArrowDown", "Home", "End", "Tab", "F1"]) {
      expect(resolveBoardKey(key({ key: named }), false)).toBeNull();
    }
  });
});
