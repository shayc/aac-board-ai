import { assertDefined } from "@shared/testing/assert-defined";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { stubAudio } from "@shared/testing/stub-audio";
import { stubSpeech } from "@shared/testing/stub-speech";
import type { OBFBoard } from "@shayc/open-board-format";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { setTileLabelPlacement } from "./appearance/appearance-store";
import { seedBoardSets, TEST_IMAGE_SRC } from "./testing";
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

describe("CommunicationBoard", () => {
  let speech: ReturnType<typeof stubSpeech>;

  beforeEach(() => {
    speech = stubSpeech();
    stubAudio();
  });

  test("composing tiles and pressing play speaks the merged message", async () => {
    const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);

    await screen.getByRole("button", { name: "hello" }).click();
    await screen.getByRole("button", { name: "world" }).click();
    // Activating a tile speaks per-tile feedback; we only assert the play call.
    speech.speak.mockClear();

    await screen.getByRole("button", { name: "Play message" }).click();

    await vi.waitFor(() => {
      expect(speech.speak.mock.calls).toHaveLength(1);
      expect(speech.speak.mock.calls[0][0].text).toBe("hello world");
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

  test("enables message playback only after content is composed", async () => {
    const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);
    const play = screen.getByRole("button", { name: "Play message" });

    await expect.element(play).toBeDisabled();

    await screen.getByRole("button", { name: "hello" }).click();

    await expect.element(play).toBeEnabled();
  });

  test("a button that spells then speaks in one tap speaks the spelled letter", async () => {
    const screen = await renderCommunicationBoard(SPELL_THEN_SPEAK_BOARD);

    await screen.getByRole("button", { name: "S", exact: true }).click();

    await vi.waitFor(() => {
      expect(speech.speak.mock.calls).toHaveLength(1);
      expect(speech.speak.mock.calls[0][0].text).toBe("s");
    });
  });

  test("names the tile grid with the board's name", async () => {
    const namedBoard: OBFBoard = { ...TWO_BUTTON_BOARD, name: "Core words" };

    const screen = await renderCommunicationBoard(namedBoard);

    await expect
      .element(screen.getByRole("grid", { name: "Core words" }))
      .toBeVisible();
  });

  test("does not scroll the grid when Home navigates to the home board", async () => {
    await seedBoardSets([{ setId: "set-1", rootBoardId: "root-board" }]);

    const screen = await renderCommunicationBoard(LARGE_GRID_BOARD, [
      "/sets/set-1/boards/other-board",
    ]);
    const grid = screen.getByRole("grid").element();
    const scrollContainer = grid.parentElement;
    assertDefined(scrollContainer);

    scrollContainer.scrollTo({
      left: scrollContainer.scrollWidth - scrollContainer.clientWidth,
      top: scrollContainer.scrollHeight - scrollContainer.clientHeight,
    });

    await vi.waitFor(() => {
      expect(scrollContainer.scrollLeft).toBeGreaterThan(0);
      expect(scrollContainer.scrollTop).toBeGreaterThan(0);
    });

    await screen.getByRole("button", { name: "Go home" }).click();

    expect(scrollContainer.scrollLeft).toBeGreaterThan(0);
    expect(scrollContainer.scrollTop).toBeGreaterThan(0);
  });

  test("scrolls the grid to both origins when Home is clicked from Home", async () => {
    await seedBoardSets([{ setId: "set-1", rootBoardId: "root-board" }]);

    const screen = await renderCommunicationBoard(LARGE_GRID_BOARD, [
      "/sets/set-1/boards/root-board",
    ]);
    const grid = screen.getByRole("grid").element();
    const scrollContainer = grid.parentElement;
    assertDefined(scrollContainer);

    scrollContainer.scrollTo({
      left: scrollContainer.scrollWidth - scrollContainer.clientWidth,
      top: scrollContainer.scrollHeight - scrollContainer.clientHeight,
    });

    await vi.waitFor(() => {
      expect(scrollContainer.scrollLeft).toBeGreaterThan(0);
      expect(scrollContainer.scrollTop).toBeGreaterThan(0);
    });

    await screen.getByRole("button", { name: "Go home" }).click();

    await vi.waitFor(() => {
      expect(scrollContainer.scrollLeft).toBe(0);
      expect(scrollContainer.scrollTop).toBe(0);
    });
  });

  test("falls back to a generic grid name when the board is unnamed", async () => {
    const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);

    await expect
      .element(screen.getByRole("grid", { name: "Communication board" }))
      .toBeVisible();
  });

  test("hides tile labels visually without removing accessible names", async () => {
    setTileLabelPlacement("hidden");

    const screen = await renderCommunicationBoard(SYMBOL_BOARD);
    const helloTile = screen.getByRole("button", { name: "hello" });
    const helloLabel = screen.getByText("hello").element();

    await expect.element(helloTile).toBeVisible();
    expect(helloLabel.getBoundingClientRect().width).toBeLessThanOrEqual(1);
  });

  test("activates a focused tile with the Space key", async () => {
    const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);
    const hello = screen.getByRole("button", { name: "hello" });

    hello.element().focus();
    await userEvent.keyboard("{Space}");

    await vi.waitFor(() => {
      expect(speech.speak).toHaveBeenCalledTimes(1);
      expect(speech.speak.mock.calls[0][0].text).toBe("hello");
    });
  });

  test("has no accessibility violations", async () => {
    const screen = await renderCommunicationBoard(TWO_BUTTON_BOARD);

    await expectNoA11yViolations(screen.container);
  });

  test("has no accessibility violations with a composed message", async () => {
    const screen = await renderCommunicationBoard(SYMBOL_BOARD);

    await screen.getByRole("button", { name: "hello" }).click();
    await screen.getByRole("button", { name: "world" }).click();

    await expectNoA11yViolations(screen.container);
  });
});
