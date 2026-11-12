import { assertDefined } from "@shared/testing/assert-defined";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { stubAudio } from "@shared/testing/stub-audio";
import {
  failSpeech,
  preventSpeechEnd,
  stubSpeech,
} from "@shared/testing/stub-speech";
import { TEST_IMAGE_SRC } from "@shared/testing/test-image";
import { setTestViewport } from "@shared/testing/viewport";
import type { OBFBoard } from "@shayc/open-board-format";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import {
  setTileBrightness,
  setTileLabelPlacement,
} from "./tile/tile-preferences-store";
import { setMessageImagesVisible } from "./message/message-preferences-store";
import {
  renderCommunicationBoard,
  TWO_BUTTON_BOARD,
} from "./testing/render-communication-board";

const SPELL_THEN_SPEAK_BOARD: OBFBoard = {
  format: "open-board-0.1",
  id: "spell-then-speak-board",
  locale: "en",
  buttons: [{ id: "btn-1", label: "S", actions: ["+s", ":speak"] }],
  grid: { rows: 1, columns: 1, order: [["btn-1"]] },
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
  const backspaceButton = container.querySelector("[aria-label='Backspace']");
  assertDefined(grid);
  assertDefined(scroller);
  assertDefined(messageBar);
  assertDefined(backspaceButton);

  if (isScrolledToEnd) {
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: "instant" });
  }

  const viewport = scroller.getBoundingClientRect();
  const backspace = backspaceButton.getBoundingClientRect();
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
  const isBarBelowGrid = backspace.top >= viewport.bottom - 0.5;
  const barAboveBottom = isBarBelowGrid
    ? messageBar.getBoundingClientRect().bottom
    : backspace.bottom;
  const edgeBelowTop = isBarBelowGrid ? backspace.top : window.innerHeight;
  const firstRow = rows.at(0);
  const lastRow = rows.at(-1);
  assertDefined(firstRow);
  assertDefined(lastRow);

  return {
    messageBarStart: messageBar.getBoundingClientRect().left,
    firstTileStart: firstColumn.left,
    backspaceEnd: window.innerWidth - backspace.right,
    barToGrid: isBarBelowGrid
      ? backspace.top - viewport.bottom
      : viewport.top - backspace.bottom,
    barAboveToFirstRow: firstRow.top - barAboveBottom,
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

      await expectNoA11yViolations(screen.container);
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

  describe("layout", () => {
    // Available heights exclude the app header (57px on phones, 65px on tablets).
    const LAYOUT_CASES = [
      {
        name: "a phone",
        width: 375,
        height: 755,
        pageMargin: 16,
        clearance: 4,
        overflowHint: 8,
        wholeRows: 5,
      },
      {
        name: "a tablet",
        width: 1024,
        height: 703,
        pageMargin: 24,
        clearance: 8,
        overflowHint: 16,
        wholeRows: 4,
      },
    ];

    test.each(LAYOUT_CASES)(
      "spaces the bars and the grid by the page margin on $name",
      async ({
        width,
        height,
        pageMargin,
        clearance,
        overflowHint,
        wholeRows,
      }) => {
        await setTestViewport(width, height);
        const screen = await renderCommunicationBoard(LARGE_GRID_BOARD);
        await expect.element(screen.getByRole("grid")).toBeVisible();

        const atStart = measureBoardLayout(screen.container);
        expect(atStart.messageBarStart).toBeCloseTo(pageMargin, 0);
        expect(atStart.firstTileStart).toBeCloseTo(pageMargin, 0);
        expect(atStart.backspaceEnd).toBeCloseTo(pageMargin, 0);
        expect(atStart.barToGrid).toBeCloseTo(clearance, 0);
        expect(atStart.barAboveToFirstRow).toBeCloseTo(pageMargin, 0);
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

    test("speaks a letter spelled earlier in the same tap", async () => {
      const screen = await renderCommunicationBoard(SPELL_THEN_SPEAK_BOARD);

      await screen.getByRole("button", { name: "S", exact: true }).click();

      await vi.waitFor(() => {
        expect(speech.spokenTexts()).toEqual(["s"]);
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

      const utterance = speech.speak.mock.calls[0]?.[0];

      assertDefined(utterance);
      utterance.dispatchEvent(new SpeechSynthesisEvent("end", { utterance }));

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

      const utterance = speech.speak.mock.calls[0]?.[0];

      assertDefined(utterance);
      utterance.dispatchEvent(
        new SpeechSynthesisErrorEvent("error", {
          utterance,
          error: "synthesis-failed",
        }),
      );

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

    test("tells the user when a tile fails to speak", async () => {
      failSpeech(speech.speak);
      const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);

      await screen.getByRole("button", { name: "hello" }).click();

      await expect
        .element(screen.getByRole("alert"))
        .toHaveTextContent("Couldn't play sound");
      expect(screen.getByRole("alert").elements()).toHaveLength(1);
      await expect
        .element(screen.getByRole("button", { name: "Play message" }))
        .toBeEnabled();
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

    test("keeps the message play action visible while a tile speaks", async () => {
      speech.speak.mockImplementationOnce(() => undefined);
      const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);

      await screen.getByRole("button", { name: "hello" }).click();

      await expect
        .element(screen.getByRole("button", { name: "Play message" }))
        .toBeVisible();
    });

    test.each([390, 1024])(
      "edits the message with Backspace alongside board navigation at a viewport width of %i",
      async (width) => {
        await setTestViewport(width, 800);
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

    test("has no accessibility violations with a composed message", async () => {
      const screen = await renderCommunicationBoard(SYMBOL_BOARD);

      await screen.getByRole("button", { name: "hello" }).click();
      await screen.getByRole("button", { name: "world" }).click();

      await expectNoA11yViolations(screen.container);
    });
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

    test("resets navigation history when Home is clicked from Home", async () => {
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

      await expect.element(back).not.toHaveAttribute("aria-disabled");

      await screen.getByRole("button", { name: "Go home" }).click();

      await expect.element(back).toHaveAttribute("aria-disabled", "true");
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
        await expectNoA11yViolations(screen.container);

        await tile.click();

        await vi.waitFor(() => {
          expect(speech.spokenTexts()).toEqual(["i need help"]);
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
          expect(speech.spokenTexts()).toEqual(["i need help"]);
        });
      },
    );
  });
});
