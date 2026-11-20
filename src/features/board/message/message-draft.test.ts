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

const EMBEDDED_PICTURE_MESSAGE: Message = {
  parts: [
    createTilePart({
      label: "hello",
      language: "en",
      imageSrc: EMBEDDED_IMAGE,
      imageSource: EMBEDDED_SOURCE,
    }),
  ],
  isWordOpen: false,
  hasPlayed: false,
};

async function seedEmbeddedSet() {
  await resetBoardsDB();
  await seedBoardSets([
    { id: "embedded-set", rootBoardId: "home", boards: [EMBEDDED_BOARD] },
  ]);
}

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
    await seedEmbeddedSet();
    const message: Message = {
      parts: [
        createTilePart({
          label: "hello",
          language: "en",
          imageSrc: EMBEDDED_IMAGE,
          soundSrc: EMBEDDED_SOUND,
          imageSource: EMBEDDED_SOURCE,
          soundSource: EMBEDDED_SOURCE,
        }),
      ],
      isWordOpen: false,
      hasPlayed: false,
    };

    saveMessageDraft(message);

    expect(localStorage.getItem(STORAGE_KEY)).not.toContain("data:");
    expect(await restoreMessageDraft()).toEqual(message);
  });

  test("restores only the media a part took from its source button", async () => {
    await seedEmbeddedSet();

    saveMessageDraft(EMBEDDED_PICTURE_MESSAGE);

    expect(await restoreMessageDraft()).toEqual(EMBEDDED_PICTURE_MESSAGE);
  });

  test("restores the words when the source board of embedded media is gone", async () => {
    const reportedErrors = collectReportedErrors();
    await resetBoardsDB();
    saveMessageDraft(EMBEDDED_PICTURE_MESSAGE);

    const restored = await restoreMessageDraft();

    expect(restored.parts).toMatchObject([
      { label: "hello", imageSrc: undefined },
    ]);
    expect(reportedErrors).toEqual([]);
  });

  test("restores a picture once its source board is back, after an edit without it", async () => {
    await resetBoardsDB();
    saveMessageDraft(EMBEDDED_PICTURE_MESSAGE);
    const withoutPicture = await restoreMessageDraft();
    saveMessageDraft({
      ...withoutPicture,
      parts: [...withoutPicture.parts, createTextPart("there", "en")],
    });
    await seedEmbeddedSet();

    const restored = await restoreMessageDraft();

    expect(restored.parts).toMatchObject([
      { label: "hello", imageSrc: EMBEDDED_IMAGE },
      { label: "there" },
    ]);
  });

  test("restores the words and reports the cause when a source board cannot be read", async () => {
    const reportedErrors = collectReportedErrors();
    await resetBoardsDB();
    saveMessageDraft(EMBEDDED_PICTURE_MESSAGE);
    onTestFinished(await makeBoardsDBUnreadable());

    const restored = await restoreMessageDraft();

    expect(restored.parts).toMatchObject([
      { label: "hello", imageSrc: undefined },
    ]);
    expect(reportedErrors.map(String)).toEqual([
      expect.stringContaining(
        "Failed to read source boards of the message draft: ",
      ),
    ]);
  });

  test("restores a long linked URL from its source when only the compact draft fits", async () => {
    const soundURL = `https://example.com/sound?token=${"x".repeat(65536)}`;
    await resetBoardsDB();
    await seedBoardSets([
      {
        id: "embedded-set",
        rootBoardId: "home",
        boards: [
          { ...EMBEDDED_BOARD, sounds: [{ id: "snd-1", url: soundURL }] },
        ],
      },
    ]);
    const message: Message = {
      ...EMBEDDED_PICTURE_MESSAGE,
      parts: [
        createTilePart({
          label: "hello",
          language: "en",
          imageSrc: EMBEDDED_IMAGE,
          soundSrc: soundURL,
          imageSource: EMBEDDED_SOURCE,
          soundSource: EMBEDDED_SOURCE,
        }),
      ],
    };
    fillLocalStorage(8192);

    saveMessageDraft(message);

    const restored = await restoreMessageDraft();
    expect(restored.parts).toMatchObject([{ imageSrc: EMBEDDED_IMAGE }]);
    // Compared outside the matcher so a failure does not print the URL.
    const [part] = restored.parts;
    expect(part?.kind === "tile" && part.soundSrc === soundURL).toBe(true);
  });

  test("restores the words when their source references do not fit", async () => {
    const words: Message = {
      parts: Array.from({ length: 20 }, (_, index) =>
        createTilePart({ label: `word ${index}`, language: "en" }),
      ),
      isWordOpen: false,
      hasPlayed: false,
    };
    fillLocalStorage(JSON.stringify(words).length + 512);

    saveMessageDraft({
      ...words,
      parts: words.parts.map((part) => ({
        ...part,
        imageSrc: EMBEDDED_IMAGE,
        imageSource: EMBEDDED_SOURCE,
      })),
    });

    expect(await restoreMessageDraft()).toEqual(words);
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
