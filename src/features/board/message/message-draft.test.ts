import { getAssetURL } from "@features/library";
import {
  loadTestImageAsset,
  makeBoardsDBUnreadable,
  makeOBFBoard,
  resetBoardsDB,
  seedBoardSets,
} from "@features/library/testing";
import { assertDefined } from "@shared/testing/assert-defined";
import { collectReportedErrors } from "@shared/testing/collect-reported-errors";
import { fillLocalStorage } from "@shared/testing/fill-local-storage";
import { describe, expect, onTestFinished, test } from "vitest";
import { restoreMessageDraft, saveMessageDraft } from "./message-draft";
import {
  createTextPart,
  createTilePart,
  EMPTY_MESSAGE,
} from "./message-transforms";
import type { ButtonKey, Message } from "./message-types";

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

const EMBEDDED_IMAGE = "data:image/png;base64,AAA";
const EMBEDDED_SOUND = "data:audio/mp3;base64,BBB";

const EMBEDDED_BOARD = makeOBFBoard({
  id: "home",
  buttons: [
    { id: "btn-1", label: "hello", image_id: "img-1", sound_id: "snd-1" },
  ],
  grid: { rows: 1, columns: 1, order: [["btn-1"]] },
  images: [{ id: "img-1", data: EMBEDDED_IMAGE }],
  sounds: [{ id: "snd-1", data: EMBEDDED_SOUND }],
});

const EMBEDDED_SOURCE: ButtonKey = {
  boardSetId: "embedded-set",
  boardId: "home",
  buttonId: "btn-1",
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

  test("restores embedded pictures and sounds from the source board without saving them", async () => {
    await resetBoardsDB();
    await seedBoardSets([
      { id: "embedded-set", rootBoardId: "home", boards: [EMBEDDED_BOARD] },
    ]);
    const message: Message = {
      parts: [
        createTilePart({
          label: "hello",
          language: "en",
          imageSrc: EMBEDDED_IMAGE,
          soundSrc: EMBEDDED_SOUND,
          source: EMBEDDED_SOURCE,
        }),
      ],
      isWordOpen: false,
      hasPlayed: false,
    };

    saveMessageDraft(message);

    expect(localStorage.getItem(STORAGE_KEY)).not.toContain("data:");
    expect(await restoreMessageDraft()).toEqual(message);
  });

  test("restores the words when the source board of embedded media is gone", async () => {
    const reportedErrors = collectReportedErrors();
    await resetBoardsDB();
    saveMessageDraft({
      ...MESSAGE,
      parts: [
        createTilePart({
          label: "hello",
          language: "en",
          imageSrc: EMBEDDED_IMAGE,
          source: EMBEDDED_SOURCE,
        }),
      ],
    });

    const restored = await restoreMessageDraft();

    expect(restored.parts).toMatchObject([
      { label: "hello", imageSrc: undefined },
    ]);
    expect(reportedErrors).toEqual([]);
  });

  test("restores the latest words when only the compact draft fits", async () => {
    saveMessageDraft(MESSAGE);
    fillLocalStorage(8192);
    const tile = createTilePart({
      label: "eau",
      language: "fr",
      vocalization: "de l’eau",
    });
    const text = createTextPart("please", "en");
    const message = { parts: [tile, text], isWordOpen: true, hasPlayed: false };
    const imageSrc = `https://example.com/image?token=${"x".repeat(65536)}`;

    saveMessageDraft({ ...message, parts: [{ ...tile, imageSrc }, text] });

    expect(await restoreMessageDraft()).toEqual(message);
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
