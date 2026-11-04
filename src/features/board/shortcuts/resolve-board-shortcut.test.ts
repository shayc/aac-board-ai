import { describe, expect, test } from "vitest";
import {
  resolveBoardShortcut,
  type BoardKeyEvent,
} from "./resolve-board-shortcut";

function key(overrides: Partial<BoardKeyEvent>): BoardKeyEvent {
  return { key: "", metaKey: false, ctrlKey: false, ...overrides };
}

describe("resolveBoardShortcut", () => {
  test("Backspace resolves to the backspace action", () => {
    expect(resolveBoardShortcut(key({ key: "Backspace" }), false)).toEqual({
      kind: "backspace",
    });
  });

  test("⌘/Ctrl+Backspace clears the message", () => {
    expect(
      resolveBoardShortcut(key({ key: "Backspace", metaKey: true }), false),
    ).toEqual({
      kind: "clear",
    });
    expect(
      resolveBoardShortcut(key({ key: "Backspace", ctrlKey: true }), false),
    ).toEqual({
      kind: "clear",
    });
  });

  test("⌘/Ctrl+Enter speaks only while idle", () => {
    expect(
      resolveBoardShortcut(key({ key: "Enter", metaKey: true }), false),
    ).toEqual({
      kind: "speak",
    });
    expect(
      resolveBoardShortcut(key({ key: "Enter", ctrlKey: true }), false),
    ).toEqual({
      kind: "speak",
    });
    expect(
      resolveBoardShortcut(key({ key: "Enter", metaKey: true }), true),
    ).toBeNull();
  });

  test("Escape cancels only while speaking", () => {
    expect(resolveBoardShortcut(key({ key: "Escape" }), true)).toEqual({
      kind: "stop",
    });
    expect(resolveBoardShortcut(key({ key: "Escape" }), false)).toBeNull();
  });

  test("Enter without a modifier is left for the focused control", () => {
    expect(resolveBoardShortcut(key({ key: "Enter" }), false)).toBeNull();
  });

  test("does not claim printable keys", () => {
    for (const typed of ["h", "5", "!", " "]) {
      expect(resolveBoardShortcut(key({ key: typed }), false)).toBeNull();
    }
  });

  test("⌘/Ctrl combos the board doesn't use pass through to the browser", () => {
    expect(
      resolveBoardShortcut(key({ key: "c", metaKey: true }), false),
    ).toBeNull();
    expect(
      resolveBoardShortcut(key({ key: "r", ctrlKey: true }), false),
    ).toBeNull();
  });

  test("navigation and other named keys are ignored", () => {
    for (const named of ["ArrowUp", "ArrowDown", "Home", "End", "Tab", "F1"]) {
      expect(resolveBoardShortcut(key({ key: named }), false)).toBeNull();
    }
  });
});
