import { obfToBoard } from "@features/library/testing";
import { setCommunicationLanguage } from "@shared/language/language-store";
import { AppProviders } from "@shared/providers/app-providers";
import { assertDefined } from "@shared/testing/assert-defined";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { stubAudio } from "@shared/testing/stub-audio";
import { stubRewriter } from "@shared/testing/stub-built-in-ai";
import {
  endUtterance,
  failUtterance,
  lastUtterance,
  preventSpeechEnd,
  reachUtteranceBoundary,
  stubSpeech,
} from "@shared/testing/stub-speech";
import { TEST_IMAGE_SRC } from "@shared/testing/test-image";
import { setTestViewport } from "@shared/testing/viewport";
import type { OBFBoard } from "@shayc/open-board-format";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { type Locator, userEvent } from "vitest/browser";
import { CommunicationBoard } from "./communication-board";
import { restoreMessageDraft } from "./message/message-draft";
import {
  setMessageHighlightingEnabled,
  setMessageImagesVisible,
  setMessagePlayTiles,
} from "./message/message-preferences-store";
import { EMPTY_MESSAGE } from "./message/message-transforms";
import type { Message } from "./message/message-types";
import {
  communicationBoardTree,
  EMPTY_MESSAGE_REVIEW,
  renderCommunicationBoard,
  TWO_BUTTON_BOARD,
} from "./testing/render-communication-board";
import {
  setTileBrightness,
  setTileLabelPlacement,
} from "./tile/tile-preferences-store";

const SPELL_THEN_SPEAK_BOARD: OBFBoard = {
  format: "open-board-0.1",
  id: "spell-then-speak-board",
  locale: "en",
  buttons: [{ id: "btn-1", label: "S", actions: ["+s", ":speak"] }],
  grid: { rows: 1, columns: 1, order: [["btn-1"]] },
};

const KEYBOARD_BOARD: OBFBoard = {
  format: "open-board-0.1",
  id: "keyboard-board",
  locale: "en",
  buttons: [
    { id: "word", label: "the" },
    { id: "letter-c", label: "C", action: "+c" },
    { id: "letter-a", label: "A", action: "+a" },
    { id: "space", label: "space", action: ":space" },
  ],
  grid: {
    rows: 1,
    columns: 4,
    order: [["word", "letter-c", "letter-a", "space"]],
  },
};

const SPEAK_THEN_CLEAR_BOARD: OBFBoard = {
  format: "open-board-0.1",
  id: "speak-then-clear-board",
  locale: "en",
  buttons: [
    {
      id: "btn-1",
      label: "Say then clear",
      vocalization: "Ignore this vocalization",
      sound_id: "recording",
      actions: ["+hi", ":speak", ":clear"],
    },
  ],
  grid: { rows: 1, columns: 1, order: [["btn-1"]] },
  sounds: [{ id: "recording", url: "/recording.mp3" }],
};

const SYMBOL_BOARD: OBFBoard = {
  format: "open-board-0.1",
  id: "symbol-board",
  locale: "en",
  buttons: [
    { id: "btn-1", label: "hello", image_id: "img-1" },
    { id: "btn-2", label: "world", image_id: "img-2" },
  ],
  grid: { rows: 1, columns: 2, order: [["btn-1", "btn-2"]] },
  images: [
    { id: "img-1", data: TEST_IMAGE_SRC },
    { id: "img-2", data: TEST_IMAGE_SRC },
  ],
};

const LARGE_GRID_SIZE = 20;
const LARGE_GRID_BOARD: OBFBoard = {
  format: "open-board-0.1",
  id: "large-grid-board",
  locale: "en",
  buttons: Array.from({ length: LARGE_GRID_SIZE ** 2 }, (_, index) => ({
    id: `btn-${index}`,
    label: `Button ${index}`,
  })),
  grid: {
    rows: LARGE_GRID_SIZE,
    columns: LARGE_GRID_SIZE,
    order: Array.from({ length: LARGE_GRID_SIZE }, (_, rowIndex) =>
      Array.from(
        { length: LARGE_GRID_SIZE },
        (_, columnIndex) => `btn-${rowIndex * LARGE_GRID_SIZE + columnIndex}`,
      ),
    ),
  },
};

function measureBoardLayout(
  container: Element,
  { isScrolledToEnd = false } = {},
) {
  const grid = container.querySelector("[role='grid']");
  const scroller = grid?.parentElement;
  const messageBar = container.querySelector("[role='list']")?.parentElement;
  const playButton = container.querySelector("[aria-label='Play message']");
  const controlBar = container
    .querySelector("[aria-label='Go home']")
    ?.closest("[data-scan-group]");
  assertDefined(grid);
  assertDefined(scroller);
  assertDefined(messageBar);
  assertDefined(playButton);
  assertDefined(controlBar);

  if (isScrolledToEnd) {
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: "instant" });
  }

  const viewport = scroller.getBoundingClientRect();
  const bar = messageBar.getBoundingClientRect();
  const play = playButton.getBoundingClientRect();
  const controls = controlBar.getBoundingClientRect();
  const rows = Array.from(grid.querySelectorAll("[role='row']"), (row) =>
    row.getBoundingClientRect(),
  );
  const columns = Array.from(
    grid.querySelectorAll("[role='row']:first-child > [role='gridcell']"),
    (cell) => cell.getBoundingClientRect(),
  );
  const wholeRows = rows.filter(
    (row) =>
      row.top >= viewport.top - 0.5 && row.bottom <= viewport.bottom + 0.5,
  );
  const firstColumn = columns.at(0);
  assertDefined(firstColumn);

  const rowAbove = rows.find(
    (row) => row.top < viewport.top - 0.5 && row.bottom > viewport.top,
  );
  const rowBelow = rows.find(
    (row) => row.top < viewport.bottom && row.bottom > viewport.bottom + 0.5,
  );
  const columnPastEnd = columns.find(
    (column) =>
      column.left < viewport.right && column.right > viewport.right + 0.5,
  );
  const isPlayBelowGrid = play.top >= viewport.bottom - 0.5;
  const areControlsBelowGrid = controls.top >= viewport.bottom - 0.5;
  const edgeAboveBottom = areControlsBelowGrid ? bar.bottom : controls.bottom;
  const edgeBelowTop = areControlsBelowGrid ? controls.top : window.innerHeight;
  const firstRow = rows.at(0);
  const lastRow = rows.at(-1);
  assertDefined(firstRow);
  assertDefined(lastRow);

  return {
    isPlayBelowGrid,
    playEnd: window.innerWidth - play.right,
    playHeight: play.height,
    messageBarStart: bar.left,
    messageBarEnd: window.innerWidth - bar.right,
    messageBarHeight: bar.height,
    firstTileStart: firstColumn.left,
    controlsToGrid: areControlsBelowGrid
      ? controls.top - viewport.bottom
      : viewport.top - controls.bottom,
    edgeAboveToFirstRow: firstRow.top - edgeAboveBottom,
    lastRowToEdgeBelow: edgeBelowTop - lastRow.bottom,
    wholeRows: wholeRows.length,
    topHint: rowAbove ? rowAbove.bottom - viewport.top : 0,
    bottomHint: rowBelow ? viewport.bottom - rowBelow.top : 0,
    sideHint: columnPastEnd ? viewport.right - columnPastEnd.left : 0,
  };
}

describe("CommunicationBoard", () => {
  let speech: ReturnType<typeof stubSpeech>;
  let audio: ReturnType<typeof stubAudio>;

  beforeEach(() => {
    speech = stubSpeech();
    audio = stubAudio();
  });

  describe("rendering", () => {
    test("has no accessibility violations", async () => {
      const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);

      await expectNoA11yViolations(screen.container, {
        reviewedIncomplete: [EMPTY_MESSAGE_REVIEW],
      });
    });

    test("exposes the message bar, controls and tiles to assistive technology", async () => {
      const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);

      await expect.element(screen.container).toMatchAriaInlineSnapshot(`
        - /children: deep-equal
        - list "Message"
        - button "Backspace" [disabled]
        - grid "Communication board":
          - row:
            - gridcell "hello":
              - button "hello"
            - gridcell "world":
              - button "world"
        - button "Go back" [disabled]
        - button "Go home" [disabled]
        - button "Play message" [disabled]
      `);
    });

    test("names the tile grid with the board's name", async () => {
      const namedBoard: OBFBoard = { ...TWO_BUTTON_BOARD, name: "Core words" };

      const screen = await renderCommunicationBoard(namedBoard);

      await expect
        .element(screen.getByRole("grid", { name: "Core words" }))
        .toBeVisible();
    });

    test.each([undefined, "", " \t\n\u00a0 "])(
      "gives the tile grid a default accessible name when the board name is %j",
      async (name) => {
        const screen = await renderCommunicationBoard({
          ...TWO_BUTTON_BOARD,
          name,
        });

        await expect
          .element(screen.getByRole("grid", { name: "Communication board" }))
          .toBeVisible();
      },
    );
  });

  describe("language", () => {
    test("marks tiles and message parts with the board's language", async () => {
      const screen = await renderCommunicationBoard({
        ...TWO_BUTTON_BOARD,
        locale: "es",
      });

      const tile = screen.getByRole("button", { name: "hello" });
      await tile.click();

      await expect.element(tile).toHaveAttribute("lang", "es");
      await expect
        .element(screen.getByRole("listitem"))
        .toHaveAttribute("lang", "es");
    });

    test("speaks a board that is not in the communication language in the board's language", async () => {
      setCommunicationLanguage("he");
      const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);

      await screen.getByRole("button", { name: "hello" }).click();

      await vi.waitFor(() => {
        expect(lastUtterance(speech.speak).lang).toBe("en");
      });
    });

    test("speaks a board that declares no language in the communication language", async () => {
      setCommunicationLanguage("he");
      const screen = await renderCommunicationBoard({
        ...TWO_BUTTON_BOARD,
        locale: undefined,
      });

      await screen.getByRole("button", { name: "hello" }).click();

      await vi.waitFor(() => {
        expect(lastUtterance(speech.speak).lang).toBe("he");
      });
    });

    test("suggests in the communication language, not the board's", async () => {
      setCommunicationLanguage("he");
      const { create } = stubRewriter((input) => `${input}!`);
      const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);

      await screen.getByRole("button", { name: "hello" }).click();

      await expect
        .element(screen.getByRole("button", { name: "hello!" }))
        .toHaveAttribute("lang", "he");
      for (const [options] of create.mock.calls) {
        expect(options).toMatchObject({ outputLanguage: "he" });
      }
    });

    test("leaves tiles on the document's language when the board declares none", async () => {
      const screen = await renderCommunicationBoard({
        ...TWO_BUTTON_BOARD,
        locale: undefined,
      });

      await expect
        .element(screen.getByRole("button", { name: "hello" }))
        .not.toHaveAttribute("lang");
    });

    test("lays the board out in the communication language's direction when the UI has no text for it", async () => {
      setCommunicationLanguage("ur");
      const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);

      const first = screen.getByRole("button", { name: "hello" }).element();
      const second = screen.getByRole("button", { name: "world" }).element();

      expect(document.documentElement).toHaveAttribute("dir", "ltr");
      expect(screen.getByRole("grid").element().matches(":dir(rtl)")).toBe(
        true,
      );
      expect(first.getBoundingClientRect().left).toBeGreaterThan(
        second.getBoundingClientRect().left,
      );
    });
  });

  describe("layout", () => {
    // Available heights exclude the app header (57px on phones, 65px on tablets,
    // 49px on a short landscape screen).
    const LAYOUT_CASES = [
      {
        name: "a phone",
        width: 375,
        height: 755,
        pageMargin: 16,
        clearance: 4,
        overflowHint: 8,
        wholeRows: 5,
        isPlayBelowGrid: true,
        playEnd: 16,
        playHeight: 48,
        messageBarStart: 16,
        // As tall as backspace, 80px, with the bar's 8px inset and 1px border.
        messageBarHeight: 80 + 2 * 8 + 2 * 1,
      },
      {
        name: "a phone on its side",
        width: 874,
        height: 353,
        pageMargin: 16,
        clearance: 4,
        overflowHint: 8,
        wholeRows: 2,
        isPlayBelowGrid: false,
        playEnd: 16 + 8 + 1,
        // Fills the compact bar inside its inset, as backspace does.
        playHeight: 64,
        // Past the back and home buttons, 64px each and 8px apart, and a 16px gap.
        messageBarStart: 16 + 64 + 8 + 64 + 16,
        // As tall as backspace, 64px, with the bar's 8px inset and 1px border.
        messageBarHeight: 64 + 2 * 8 + 2 * 1,
      },
      {
        name: "a wide, short desktop window",
        width: 1440,
        height: 531,
        pageMargin: 16,
        clearance: 4,
        overflowHint: 8,
        wholeRows: 3,
        isPlayBelowGrid: false,
        playEnd: 16 + 8 + 1,
        playHeight: 64,
        messageBarStart: 16 + 64 + 8 + 64 + 16,
        messageBarHeight: 64 + 2 * 8 + 2 * 1,
      },
      {
        name: "a tablet",
        width: 1024,
        height: 703,
        pageMargin: 24,
        clearance: 8,
        overflowHint: 16,
        wholeRows: 5,
        isPlayBelowGrid: false,
        // Inside the bar, past its 8px inset and 1px border.
        playEnd: 24 + 8 + 1,
        playHeight: 80,
        // Back and home grow to play's 80px where the bar has room for it.
        messageBarStart: 24 + 80 + 8 + 80 + 16,
        // Play, 80px, sets the height where there is room for it.
        messageBarHeight: 80 + 2 * 8 + 2 * 1,
      },
    ];

    test.each(LAYOUT_CASES)(
      "places play and spaces the bars and the grid by the page margin on $name",
      async ({
        width,
        height,
        pageMargin,
        clearance,
        overflowHint,
        wholeRows,
        isPlayBelowGrid,
        playEnd,
        playHeight,
        messageBarStart,
        messageBarHeight,
      }) => {
        await setTestViewport(width, height);
        const screen = await renderCommunicationBoard(LARGE_GRID_BOARD);
        await expect.element(screen.getByRole("grid")).toBeVisible();

        const atStart = measureBoardLayout(screen.container);
        expect(atStart.isPlayBelowGrid).toBe(isPlayBelowGrid);
        expect(atStart.playEnd).toBeCloseTo(playEnd, 0);
        expect(atStart.playHeight).toBeCloseTo(playHeight, 0);
        expect(atStart.messageBarStart).toBeCloseTo(messageBarStart, 0);
        expect(atStart.messageBarEnd).toBeCloseTo(pageMargin, 0);
        expect(atStart.messageBarHeight).toBeCloseTo(messageBarHeight, 0);
        expect(atStart.firstTileStart).toBeCloseTo(pageMargin, 0);
        expect(atStart.controlsToGrid).toBeCloseTo(clearance, 0);
        expect(atStart.edgeAboveToFirstRow).toBeCloseTo(pageMargin, 0);
        expect(atStart.wholeRows).toBe(wholeRows);
        expect(atStart.bottomHint).toBeCloseTo(overflowHint, 0);
        expect(atStart.sideHint).toBeCloseTo(overflowHint, 0);

        const atEnd = measureBoardLayout(screen.container, {
          isScrolledToEnd: true,
        });
        expect(atEnd.lastRowToEdgeBelow).toBeCloseTo(pageMargin, 0);
        expect(atEnd.topHint).toBeCloseTo(overflowHint, 0);
      },
    );
  });

  describe("message row icons", () => {
    test.each([
      { name: "a tablet", width: 1024, height: 703 },
      { name: "a wide, short desktop window", width: 1440, height: 531 },
    ])(
      "gives back and home backspace's icon, lighter than play's, on $name",
      async ({ width, height }) => {
        await setTestViewport(width, height);
        const screen = await renderCommunicationBoard(LARGE_GRID_BOARD);
        await expect.element(screen.getByRole("grid")).toBeVisible();

        const button = (name: string) => screen.getByRole("button", { name });
        const back = iconSize(button("Go back"));
        const home = iconSize(button("Go home"));
        const backspace = iconSize(button("Backspace"));
        const play = iconSize(button("Play message"));

        expect(back).toBe(backspace);
        expect(home).toBe(backspace);
        expect(backspace).toBeLessThan(play);
      },
    );
  });

  describe("phone controls", () => {
    // The narrowest phones, and larger ones with display zoom, are 320px wide.
    test.each([{ width: 375 }, { width: 320 }])(
      "makes back, home and play equally wide, with play at the far end, on a $width px wide phone",
      async ({ width }) => {
        await setTestViewport(width, 755);
        const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);

        const back = screen
          .getByRole("button", { name: "Go back" })
          .element()
          .getBoundingClientRect();
        const home = screen
          .getByRole("button", { name: "Go home" })
          .element()
          .getBoundingClientRect();
        const play = screen
          .getByRole("button", { name: "Play message" })
          .element()
          .getBoundingClientRect();

        expect(back.width).toBeCloseTo(88, 0);
        expect(home.width).toBeCloseTo(88, 0);
        expect(play.width).toBeCloseTo(88, 0);
        expect(back.left).toBeCloseTo(16, 0);
        expect(play.right).toBeCloseTo(width - 16, 0);
        expect(play.left - home.right).toBeGreaterThanOrEqual(16 - 0.5);
      },
    );
  });

  describe("tile activation", () => {
    test("activates a focused tile with the Space key", async () => {
      const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);
      const hello = screen.getByRole("button", { name: "hello" });

      hello.element().focus();
      await userEvent.keyboard("{Space}");

      await vi.waitFor(() => {
        expect(speech.spokenTexts()).toEqual(["hello"]);
      });
    });

    test("speaks a tile's actions instead of its vocalization or sound", async () => {
      const screen = await renderCommunicationBoard(SPEAK_THEN_CLEAR_BOARD);

      await screen.getByRole("button", { name: "Say then clear" }).click();

      await vi.waitFor(() => {
        expect(speech.spokenTexts()).toEqual(["hi"]);
      });
      expect(audio.play).not.toHaveBeenCalled();
    });

    test("adds a tile to the message silently when tiles are not played, and plays it with the message", async () => {
      setMessagePlayTiles(false);
      const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);

      await screen.getByRole("button", { name: "hello" }).click();
      await screen.getByRole("button", { name: "Play message" }).click();

      // A tile that had played would have spoken before the message did.
      await vi.waitFor(() => {
        expect(speech.spokenTexts()).toEqual(["hello"]);
      });
    });

    test("stops the message when a tile is selected while it plays and tiles are not played", async () => {
      setMessagePlayTiles(false);
      preventSpeechEnd(speech.speak);
      const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);
      const play = screen.getByRole("button", { name: "Play message" });

      await screen.getByRole("button", { name: "hello" }).click();
      await play.click();
      await expect
        .element(screen.getByRole("button", { name: "Stop message" }))
        .toBeVisible();
      await screen.getByRole("button", { name: "world" }).click();

      await expect.element(play).toBeVisible();
      expect(speech.spokenTexts()).toEqual(["hello"]);
    });

    test.each(["", " \t\n "])(
      "speaks the label when the vocalization is blank (%j)",
      async (vocalization) => {
        const board: OBFBoard = {
          ...TWO_BUTTON_BOARD,
          buttons: [{ id: "btn-1", label: "hello", vocalization }],
          grid: { rows: 1, columns: 1, order: [["btn-1"]] },
        };
        const screen = await renderCommunicationBoard(board);

        await screen
          .getByRole("button", { name: "hello", exact: true })
          .click();

        await vi.waitFor(() => {
          expect(speech.spokenTexts()).toEqual(["hello"]);
        });
      },
    );
  });

  describe("message draft", () => {
    test("keeps an edit made after a board closed mid-speech", async () => {
      preventSpeechEnd(speech.speak);
      const screen = await render(closableBoardTree({ isOpen: true }));
      await screen.getByRole("button", { name: "hello" }).click();
      await screen.getByRole("button", { name: "Play message" }).click();
      const closedBoardUtterance = lastUtterance(speech.speak);
      await screen.rerender(closableBoardTree({ isOpen: false }));
      const restoredMessage = await restoreMessageDraft();
      await screen.rerender(
        closableBoardTree({ isOpen: true, initialMessage: restoredMessage }),
      );

      await screen.getByRole("button", { name: "Backspace" }).click();
      endUtterance(closedBoardUtterance);
      await expect
        .element(screen.getByRole("button", { name: "Play message" }))
        .toBeInTheDocument();

      expect(await restoreMessageDraft()).toBe(EMPTY_MESSAGE);
    });
  });

  describe("speak-then-clear tiles", () => {
    test("clears the message once a speak-then-clear tile finishes speaking", async () => {
      preventSpeechEnd(speech.speak);
      const screen = await renderCommunicationBoard(SPEAK_THEN_CLEAR_BOARD);
      const message = screen.getByText("hi", { exact: true });

      await screen.getByRole("button", { name: "Say then clear" }).click();
      await expect
        .element(screen.getByRole("button", { name: "Stop message" }))
        .toBeVisible();
      await expect.element(message).toBeVisible();

      endUtterance(lastUtterance(speech.speak));

      await expect.element(message).not.toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "Play message" }))
        .toBeDisabled();
    });

    test("keeps the message when a speak-then-clear tile fails to speak", async () => {
      preventSpeechEnd(speech.speak);
      const screen = await renderCommunicationBoard(SPEAK_THEN_CLEAR_BOARD);

      await screen.getByRole("button", { name: "Say then clear" }).click();
      await expect
        .element(screen.getByRole("button", { name: "Stop message" }))
        .toBeVisible();

      failUtterance(lastUtterance(speech.speak));

      await expect
        .element(screen.getByRole("button", { name: "Play message" }))
        .toBeEnabled();
      await expect
        .element(screen.getByText("hi", { exact: true }))
        .toBeVisible();
      await expect
        .element(screen.getByRole("alert"))
        .toHaveTextContent("Couldn't play sound");
      expect(screen.getByRole("alert").elements()).toHaveLength(1);
    });

    test("keeps a message that was edited while a speak-then-clear tile spoke", async () => {
      preventSpeechEnd(speech.speak);
      const screen = await renderCommunicationBoard(SPEAK_THEN_CLEAR_BOARD);

      await screen.getByRole("button", { name: "Say then clear" }).click();
      await screen.getByRole("button", { name: "Backspace" }).click();
      endUtterance(lastUtterance(speech.speak));
      await screen.getByRole("button", { name: "Play message" }).click();

      await vi.waitFor(() => {
        expect(speech.spokenTexts()).toEqual(["hi", "h"]);
      });
    });

    test("keeps the message when a speak-then-clear tile is stopped mid-speech", async () => {
      preventSpeechEnd(speech.speak);
      const screen = await renderCommunicationBoard(SPEAK_THEN_CLEAR_BOARD);

      await screen.getByRole("button", { name: "Say then clear" }).click();
      await screen.getByRole("button", { name: "Stop message" }).click();
      speech.speak.mockClear();
      await screen.getByRole("button", { name: "Play message" }).click();

      await vi.waitFor(() => {
        expect(speech.spokenTexts()).toEqual(["hi"]);
      });
    });
  });

  describe("message", () => {
    test("has no accessibility violations with a composed message", async () => {
      const screen = await renderCommunicationBoard(SYMBOL_BOARD);

      await screen.getByRole("button", { name: "hello" }).click();
      await screen.getByRole("button", { name: "world" }).click();

      await expectNoA11yViolations(screen.container);
    });

    test("exposes each composed word to assistive technology", async () => {
      const screen = await renderCommunicationBoard(SYMBOL_BOARD);

      await screen.getByRole("button", { name: "hello" }).click();
      await screen.getByRole("button", { name: "world" }).click();

      await expect.element(screen.getByRole("list")).toMatchAriaInlineSnapshot(`
        - /children: deep-equal
        - list "Message":
          - listitem: hello
          - listitem: world
      `);
    });

    test("enables message playback only after content is composed", async () => {
      const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);
      const play = screen.getByRole("button", { name: "Play message" });

      await expect.element(play).toBeDisabled();

      await screen.getByRole("button", { name: "hello" }).click();

      await expect.element(play).toBeEnabled();
    });

    test("keeps keyboard focus on Backspace when it removes the last part", async () => {
      const screen = await renderCommunicationBoard(SYMBOL_BOARD);
      const backspace = screen.getByRole("button", { name: "Backspace" });

      await screen.getByRole("button", { name: "hello" }).click();
      await expect.element(backspace).not.toHaveAttribute("aria-disabled");
      backspace.element().focus();
      await userEvent.keyboard("{Enter}");

      await expect.element(backspace).toHaveAttribute("aria-disabled", "true");
      await expect.element(backspace).toHaveFocus();
    });

    test("speaks the composed message when play is pressed", async () => {
      const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);

      await screen.getByRole("button", { name: "hello" }).click();
      await screen.getByRole("button", { name: "world" }).click();
      speech.speak.mockClear();

      await screen.getByRole("button", { name: "Play message" }).click();

      await vi.waitFor(() => {
        expect(speech.spokenTexts()).toEqual(["hello world"]);
      });
    });

    test("outlines each message part at its speech boundary", async () => {
      const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);

      await screen.getByRole("button", { name: "hello" }).click();
      await screen.getByRole("button", { name: "world" }).click();
      preventSpeechEnd(speech.speak);
      await screen.getByRole("button", { name: "Play message" }).click();

      const utterance = lastUtterance(speech.speak);
      reachUtteranceBoundary(utterance, 0);
      await expect.poll(() => outlinedMessageParts(screen)).toEqual(["hello"]);

      reachUtteranceBoundary(utterance, "hello world".indexOf("world"));
      await expect.poll(() => outlinedMessageParts(screen)).toEqual(["world"]);

      endUtterance(utterance);
      await expect.poll(() => outlinedMessageParts(screen)).toEqual([]);
    });

    test("leaves multiple message parts unoutlined when speech sends no boundaries", async () => {
      const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);

      await screen.getByRole("button", { name: "hello" }).click();
      await screen.getByRole("button", { name: "world" }).click();
      preventSpeechEnd(speech.speak);
      await screen.getByRole("button", { name: "Play message" }).click();

      await expect
        .element(screen.getByRole("button", { name: "Stop message" }))
        .toBeVisible();
      expect(outlinedMessageParts(screen)).toEqual([]);

      endUtterance(lastUtterance(speech.speak));
      await expect
        .element(screen.getByRole("button", { name: "Play message" }))
        .toBeVisible();
      expect(outlinedMessageParts(screen)).toEqual([]);
    });

    test("outlines a single message part when speech sends no boundaries", async () => {
      const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);

      await screen.getByRole("button", { name: "hello" }).click();
      preventSpeechEnd(speech.speak);
      await screen.getByRole("button", { name: "Play message" }).click();

      await expect.poll(() => outlinedMessageParts(screen)).toEqual(["hello"]);

      endUtterance(lastUtterance(speech.speak));
      await expect.poll(() => outlinedMessageParts(screen)).toEqual([]);
    });

    test("outlines no message part while playing when highlighting is off", async () => {
      setMessageHighlightingEnabled(false);
      const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);

      await screen.getByRole("button", { name: "hello" }).click();
      preventSpeechEnd(speech.speak);
      await screen.getByRole("button", { name: "Play message" }).click();

      await expect
        .element(screen.getByRole("button", { name: "Stop message" }))
        .toBeVisible();
      expect(outlinedMessageParts(screen)).toEqual([]);
    });

    test("spells a new word after a word tile and closes it with space", async () => {
      const screen = await renderCommunicationBoard(KEYBOARD_BOARD);
      const messageItems = getMessageItems(screen);

      await screen.getByRole("button", { name: "the" }).click();
      await screen.getByRole("button", { name: "C", exact: true }).click();
      await screen.getByRole("button", { name: "A", exact: true }).click();
      await screen.getByRole("button", { name: "space" }).click();
      await screen.getByRole("button", { name: "the" }).click();

      await expect.element(messageItems).toHaveLength(3);
      await expect.element(messageItems.nth(0)).toHaveTextContent("the");
      await expect.element(messageItems.nth(1)).toHaveTextContent("ca");
      await expect.element(messageItems.nth(2)).toHaveTextContent("the");
    });

    test("leaves the message empty when space is pressed first", async () => {
      const screen = await renderCommunicationBoard(KEYBOARD_BOARD);

      await screen.getByRole("button", { name: "space" }).click();

      await expect.element(getMessageItems(screen)).toHaveLength(0);
      await expect
        .element(screen.getByRole("button", { name: "Play message" }))
        .toBeDisabled();
      await expect
        .element(screen.getByRole("button", { name: "Backspace" }))
        .toBeDisabled();
    });

    test("starts a new message with the next tile after the message has played", async () => {
      const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);
      const messageItems = getMessageItems(screen);

      await screen.getByRole("button", { name: "hello" }).click();
      await screen.getByRole("button", { name: "Play message" }).click();
      await vi.waitFor(() => {
        expect(speech.spokenTexts()).toEqual(["hello", "hello"]);
      });
      await expect.element(messageItems).toHaveLength(1);

      await screen.getByRole("button", { name: "world" }).click();

      await expect.element(messageItems).toHaveLength(1);
      await expect.element(messageItems).toHaveTextContent("world");
    });

    test("keeps spelling on a keyboard that speaks each letter", async () => {
      const screen = await renderCommunicationBoard(SPELL_THEN_SPEAK_BOARD);
      const spellButton = screen.getByRole("button", { name: "S" });

      await spellButton.click();
      await vi.waitFor(() => {
        expect(speech.spokenTexts()).toEqual(["s"]);
      });
      await spellButton.click();

      await vi.waitFor(() => {
        expect(speech.spokenTexts()).toEqual(["s", "ss"]);
      });
      const messageItems = getMessageItems(screen);
      await expect.element(messageItems).toHaveLength(1);
      await expect
        .element(messageItems.getByText("ss", { exact: true }))
        .toBeVisible();
    });

    test("adds to a message whose playback was stopped", async () => {
      preventSpeechEnd(speech.speak);
      const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);

      await screen.getByRole("button", { name: "hello" }).click();
      await screen.getByRole("button", { name: "Play message" }).click();
      await screen.getByRole("button", { name: "Stop message" }).click();
      await screen.getByRole("button", { name: "world" }).click();

      await expect.element(getMessageItems(screen)).toHaveLength(2);
    });

    test("keeps the message play action visible while a tile speaks", async () => {
      speech.speak.mockImplementationOnce(() => undefined);
      const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);

      await screen.getByRole("button", { name: "hello" }).click();

      await expect
        .element(screen.getByRole("button", { name: "Play message" }))
        .toBeVisible();
    });

    test.each([
      { width: 390, height: 800 },
      { width: 1024, height: 800 },
      { width: 844, height: 390 },
    ])(
      "edits the message with Backspace alongside board navigation on a $width by $height viewport",
      async ({ width, height }) => {
        await setTestViewport(width, height);
        const screen = await renderCommunicationBoard(
          SYMBOL_BOARD,
          [`/sets/set-1/boards/${SYMBOL_BOARD.id}`],
          SYMBOL_BOARD.id,
        );
        const backspace = screen.getByRole("button", { name: "Backspace" });
        const play = screen.getByRole("button", { name: "Play message" });

        await expect
          .element(backspace)
          .toHaveAttribute("aria-disabled", "true");
        await expect
          .element(screen.getByRole("button", { name: "Go back" }))
          .toBeVisible();
        await expect
          .element(screen.getByRole("button", { name: "Go home" }))
          .toBeVisible();

        await screen.getByRole("button", { name: "hello" }).click();
        await screen.getByRole("button", { name: "world" }).click();
        await backspace.click();
        speech.speak.mockClear();
        await play.click();

        await vi.waitFor(() => {
          expect(speech.spokenTexts()).toEqual(["hello"]);
        });

        await backspace.click();

        await expect
          .element(backspace)
          .toHaveAttribute("aria-disabled", "true");
        await expect.element(play).toBeDisabled();
      },
    );
  });

  describe("navigation", () => {
    test("navigates from a linked tile without running its actions or playing its content", async () => {
      const board: OBFBoard = {
        ...TWO_BUTTON_BOARD,
        buttons: [
          { id: "btn-1", label: "hello" },
          {
            id: "btn-2",
            label: "Folder",
            load_board: { id: "child-board" },
            actions: [":clear", ":speak", ":home"],
            sound_id: "recording",
          },
        ],
        sounds: [{ id: "recording", url: "/folder.mp3" }],
      };
      const screen = await renderCommunicationBoard(
        board,
        ["/sets/set-1/boards/test-board"],
        "test-board",
      );
      const back = screen.getByRole("button", { name: "Go back" });

      await expect.element(back).toHaveAttribute("aria-disabled", "true");
      await screen.getByRole("button", { name: "hello" }).click();
      speech.speak.mockClear();

      await screen.getByRole("button", { name: "Folder" }).click();

      await expect.element(back).not.toHaveAttribute("aria-disabled");
      await expect
        .element(screen.getByRole("button", { name: "Play message" }))
        .toBeEnabled();
      expect(speech.speak).not.toHaveBeenCalled();
      expect(audio.play).not.toHaveBeenCalled();
    });

    test("keeps keyboard focus on Go back when it reaches the first board", async () => {
      const screen = await renderCommunicationBoard(
        TWO_BUTTON_BOARD,
        [
          "/sets/set-1/boards/test-board",
          {
            pathname: "/sets/set-1/boards/test-board",
            state: { canGoBack: true },
          },
        ],
        "test-board",
      );
      const back = screen.getByRole("button", { name: "Go back" });

      await expect.element(back).not.toHaveAttribute("aria-disabled");
      back.element().focus();
      await userEvent.keyboard("{Enter}");

      await expect.element(back).toHaveAttribute("aria-disabled", "true");
      await expect.element(back).toHaveFocus();
    });

    test("keeps keyboard focus in the same cell when the next board reuses its button IDs", async () => {
      const nextBoard: OBFBoard = {
        ...TWO_BUTTON_BOARD,
        id: "next-board",
        buttons: [
          { id: "btn-1", label: "yes" },
          { id: "btn-2", label: "no" },
        ],
      };
      const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);
      const focusedTile = screen
        .getByRole("button", { name: "world" })
        .element();
      focusedTile.focus();

      await screen.rerender(communicationBoardTree(nextBoard));

      expect(focusedTile.isConnected).toBe(false);
      await expect
        .element(screen.getByRole("button", { name: "no" }))
        .toHaveFocus();
    });

    test("disables Home on the home board and keeps Back", async () => {
      const screen = await renderCommunicationBoard(
        TWO_BUTTON_BOARD,
        [
          {
            pathname: "/sets/set-1/boards/test-board",
            state: { canGoBack: true },
          },
        ],
        "test-board",
      );
      const back = screen.getByRole("button", { name: "Go back" });
      const home = screen.getByRole("button", { name: "Go home" });

      await expect.element(home).toHaveAttribute("aria-disabled", "true");
      await expect.element(back).not.toHaveAttribute("aria-disabled");
    });
  });

  describe("label and image preferences", () => {
    test("hides tile labels visually without removing accessible names", async () => {
      setTileLabelPlacement("hidden");

      const screen = await renderCommunicationBoard(SYMBOL_BOARD);
      const helloTile = screen.getByRole("button", { name: "hello" });
      const helloLabel = screen.getByText("hello").element();

      await expect.element(helloTile).toBeVisible();
      expect(helloLabel.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    });

    test("dims symbols on tiles and leaves the message's symbols alone", async () => {
      setTileBrightness(0.8);

      const screen = await renderCommunicationBoard(SYMBOL_BOARD);
      const helloTile = screen.getByRole("button", { name: "hello" });
      await expect.element(helloTile).toBeVisible();
      const tileSymbols = Array.from(screen.container.querySelectorAll("img"));

      await helloTile.click();

      await expect
        .poll(() => screen.container.querySelectorAll("img"))
        .toHaveLength(tileSymbols.length + 1);
      const messageSymbols = Array.from(
        screen.container.querySelectorAll("img"),
      ).filter((symbol) => !tileSymbols.includes(symbol));
      const filterOf = (symbol: Element) => getComputedStyle(symbol).filter;

      expect(tileSymbols.map(filterOf)).toEqual(
        tileSymbols.map(() => "brightness(0.8)"),
      );
      expect(messageSymbols.map(filterOf)).toEqual(["none"]);
    });

    test("shows message parts as labels only when message images are hidden", async () => {
      setMessageImagesVisible(false);

      const screen = await renderCommunicationBoard(SYMBOL_BOARD);
      const helloTile = screen.getByRole("button", { name: "hello" });
      await expect.element(helloTile).toBeVisible();
      const tileImageCount = screen.container.querySelectorAll("img").length;

      await helloTile.click();

      await expect.poll(() => screen.getByText("hello").all()).toHaveLength(2);
      expect(screen.container.querySelectorAll("img")).toHaveLength(
        tileImageCount,
      );
    });

    test.each([
      { description: "missing", label: undefined },
      { description: "empty", label: "" },
      { description: "whitespace-only", label: " \t " },
    ])(
      "names a tile by its vocalization when its label is $description",
      async ({ label }) => {
        const board: OBFBoard = {
          format: "open-board-0.1",
          id: "vocalization-board",
          locale: "en",
          buttons: [
            {
              id: "help",
              label,
              vocalization: "I need help",
              image_id: "help-image",
            },
          ],
          grid: { rows: 1, columns: 1, order: [["help"]] },
          images: [{ id: "help-image", data: TEST_IMAGE_SRC }],
        };
        const screen = await renderCommunicationBoard(board);
        const tile = screen.getByRole("button", {
          name: "I need help",
          exact: true,
        });

        await expect.element(tile).toBeVisible();
        expect(tile.element().textContent).toBe("");
        await expectNoA11yViolations(screen.container, {
          reviewedIncomplete: [EMPTY_MESSAGE_REVIEW],
        });

        await tile.click();

        await vi.waitFor(() => {
          expect(speech.spokenTexts()).toEqual(["I need help"]);
        });
      },
    );

    test.each(["top", "hidden"] as const)(
      "keeps a %s label as the accessible name when vocalization differs",
      async (placement) => {
        setTileLabelPlacement(placement);
        const board: OBFBoard = {
          ...SYMBOL_BOARD,
          buttons: SYMBOL_BOARD.buttons.map((button) => ({
            ...button,
            vocalization: "I need help",
          })),
        };
        const screen = await renderCommunicationBoard(board);
        const tile = screen.getByRole("button", { name: "hello", exact: true });

        await expect.element(tile).toHaveAccessibleName("hello");

        await tile.click();

        await vi.waitFor(() => {
          expect(speech.spokenTexts()).toEqual(["I need help"]);
        });
      },
    );
  });
});

function iconSize(button: Locator): number {
  const icon = button.element().querySelector("svg");
  assertDefined(icon);

  return icon.getBoundingClientRect().width;
}

function getMessageItems(
  screen: Awaited<ReturnType<typeof renderCommunicationBoard>>,
) {
  return screen.getByRole("list", { name: "Message" }).getByRole("listitem");
}

function outlinedMessageParts(
  screen: Awaited<ReturnType<typeof renderCommunicationBoard>>,
): (string | null)[] {
  return getMessageItems(screen)
    .elements()
    .filter((part) => getComputedStyle(part).outlineStyle === "solid")
    .map((part) => part.textContent);
}

interface ClosableBoardTreeProps {
  isOpen: boolean;
  initialMessage?: Message;
}

// Keeps the providers mounted while the board closes, as the error page does.
function closableBoardTree({ isOpen, initialMessage }: ClosableBoardTreeProps) {
  return (
    <MemoryRouter>
      <AppProviders>
        <div style={{ height: "100vh" }}>
          {isOpen && (
            <CommunicationBoard
              board={obfToBoard(TWO_BUTTON_BOARD)}
              language={TWO_BUTTON_BOARD.locale}
              rootBoardId={undefined}
              initialMessage={initialMessage}
            />
          )}
        </div>
      </AppProviders>
    </MemoryRouter>
  );
}
