import { getAssetURL } from "@features/library";
import {
  loadTestImageAsset,
  makeBoardsDBUnreadable,
  resetBoardsDB,
  seedBoardSets,
} from "@features/library/testing";
import { assertDefined } from "@shared/testing/assert-defined";
import { collectReportedErrors } from "@shared/testing/collect-reported-errors";
import { describe, expect, onTestFinished, test } from "vitest";
import {
  createTextPart,
  createTilePart,
  EMPTY_MESSAGE,
  type Message,
} from "./message";
import { restoreMessageDraft, saveMessageDraft } from "./message-draft";

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
  test("restores the saved message", async () => {
    saveMessageDraft(MESSAGE);

    expect(await restoreMessageDraft()).toEqual(MESSAGE);
  });

  test.each([
    { description: "nothing is saved", stored: null },
    { description: "the draft is not JSON", stored: "{ not json" },
    { description: "the draft has no parts", stored: JSON.stringify({}) },
  ])("restores an empty message when $description", async ({ stored }) => {
    if (stored !== null) {
      localStorage.setItem(STORAGE_KEY, stored);
    }

    expect(await restoreMessageDraft()).toBe(EMPTY_MESSAGE);
  });

  test("drops parts it cannot read and closes a word that lost its part", async () => {
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

    expect(await restoreMessageDraft()).toEqual({
      parts: [{ kind: "tile", id: "1", label: "hello", language: "en" }],
      isWordOpen: false,
      hasPlayed: true,
    });
  });

  test("restores the words and reports the cause when stored media cannot be read", async () => {
    const reportedErrors = collectReportedErrors();
    await resetBoardsDB();
    await seedBoardSets([
      {
        id: "media-set",
        rootBoardId: "home",
        assets: [await loadTestImageAsset("images/hello.png")],
      },
    ]);
    const imageSrc = await getAssetURL("media-set", "images/hello.png");
    assertDefined(imageSrc);
    saveMessageDraft({
      ...MESSAGE,
      parts: [createTilePart({ label: "hello", language: "en", imageSrc })],
    });
    // Emptying the set revokes its URLs, so restoring must read storage.
    await resetBoardsDB();
    onTestFinished(await makeBoardsDBUnreadable());

    const restored = await restoreMessageDraft();

    expect(restored.parts).toMatchObject([
      { label: "hello", imageSrc: undefined },
    ]);
    expect(reportedErrors.map(String)).toEqual([
      expect.stringContaining(
        "Failed to read stored assets of the message draft: ",
      ),
    ]);
  });

  test("leaves out an object URL with no stored asset behind it", async () => {
    saveMessageDraft({
      ...MESSAGE,
      parts: [
        createTilePart({
          label: "hello",
          language: "en",
          imageSrc: "blob:http://localhost/deleted-asset",
        }),
      ],
    });

    const restored = await restoreMessageDraft();

    expect(restored.parts).toMatchObject([
      { label: "hello", imageSrc: undefined },
    ]);
  });

  test("removes an older draft when a newer one does not fit", async () => {
    saveMessageDraft(MESSAGE);
    fillLocalStorage();

    saveMessageDraft({
      ...MESSAGE,
      parts: [createTextPart("a".repeat(256 * 1024), "en")],
    });

    expect(await restoreMessageDraft()).toBe(EMPTY_MESSAGE);
  });
});

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
