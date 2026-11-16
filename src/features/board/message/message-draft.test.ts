import { describe, expect, test } from "vitest";
import { readMessageDraft, saveMessageDraft } from "./message-draft";
import {
  createTextPart,
  createTilePart,
  EMPTY_MESSAGE,
} from "./message-transforms";
import type { Message } from "./message-types";

const STORAGE_KEY = "message-draft";

const MESSAGE: Message = {
  parts: [
    createTilePart({
      label: "hello",
      language: "en",
      vocalization: "hi there",
      imageSrc: "https://example.com/hello.png",
    }),
    createTextPart("wor", "en"),
  ],
  isWordOpen: true,
  hasPlayed: false,
};

describe("message draft", () => {
  test("reads back the saved message", () => {
    saveMessageDraft(MESSAGE);

    expect(readMessageDraft().message).toEqual(MESSAGE);
  });

  test.each([
    { description: "nothing is saved", stored: null },
    { description: "the draft is not JSON", stored: "{ not json" },
    { description: "the draft has no parts", stored: JSON.stringify({}) },
  ])("reads an empty message when $description", ({ stored }) => {
    if (stored !== null) {
      localStorage.setItem(STORAGE_KEY, stored);
    }

    expect(readMessageDraft().message).toBe(EMPTY_MESSAGE);
  });

  test("drops parts it cannot read and closes a word that lost its part", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        parts: [
          { kind: "tile", id: "1", label: "hello", language: "en" },
          { kind: "text", id: "2" },
          { kind: "unknown", id: "3", label: "?" },
        ],
        isWordOpen: true,
        hasPlayed: true,
      }),
    );

    expect(readMessageDraft().message).toEqual({
      parts: [{ kind: "tile", id: "1", label: "hello", language: "en" }],
      isWordOpen: false,
      hasPlayed: true,
    });
  });

  test("removes the draft when the message is emptied", () => {
    saveMessageDraft(MESSAGE);

    saveMessageDraft(EMPTY_MESSAGE);

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test("removes an older draft when a newer one does not fit", () => {
    saveMessageDraft(MESSAGE);
    fillLocalStorage();

    saveMessageDraft({
      ...MESSAGE,
      parts: [createTextPart("a".repeat(256 * 1024), "en")],
    });

    expect(readMessageDraft().message).toBe(EMPTY_MESSAGE);
  });
});

// Fills the origin's real quota, leaving less room than a large draft needs.
function fillLocalStorage() {
  let chunk = "x".repeat(1024 * 1024);
  let index = 0;

  while (chunk.length > 0) {
    try {
      localStorage.setItem(`filler-${index}`, chunk);
      index += 1;
    } catch {
      chunk = chunk.slice(0, Math.floor(chunk.length / 2));
    }
  }
}
