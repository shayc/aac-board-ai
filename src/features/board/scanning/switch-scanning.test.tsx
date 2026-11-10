import { expectNoA11yViolations } from "@shared/testing/axe";
import { stubSpeech } from "@shared/testing/stub-speech";
import type { OBFBoard } from "@shayc/open-board-format";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  onTestFinished,
  test,
  vi,
} from "vitest";
import { page, userEvent, type Locator } from "vitest/browser";
import { renderCommunicationBoard } from "../testing/render-communication-board";
import {
  setFirstItemDelay,
  setRepeatPressDelay,
  setScanCount,
  setScanMethod,
  setScanningEnabled,
  setScanPattern,
  setScanTime,
} from "./scanning-preferences-store";

const TWO_ROW_BOARD: OBFBoard = {
  format: "open-board-0.1",
  id: "two-row-board",
  locale: "en",
  buttons: [
    { id: "btn-1", label: "hello" },
    { id: "btn-2", label: "world" },
    { id: "btn-3", label: "yes" },
    { id: "btn-4", label: "no" },
  ],
  grid: {
    rows: 2,
    columns: 2,
    order: [
      ["btn-1", "btn-2"],
      ["btn-3", "btn-4"],
    ],
  },
};

const HIGHLIGHT = "data-scan-highlight";

async function renderBoard() {
  const screen = await renderCommunicationBoard(TWO_ROW_BOARD);

  return {
    screen,
    tile: (name: string) => screen.getByRole("button", { name, exact: true }),
    row: (index: number) => screen.getByRole("row").nth(index),
    play: screen.getByRole("button", { name: "Play message" }),
    backspace: screen.getByRole("button", { name: "Backspace" }),
  };
}

/** Stands in for an app header control, which lives outside the board. */
function addOutsideButton() {
  const element = document.createElement("button");
  const onClick = vi.fn();

  element.textContent = "Outside";
  element.addEventListener("click", onClick);
  document.body.prepend(element);
  onTestFinished(() => element.remove());

  return { element, onClick };
}

function findHighlighted(container: Element) {
  return container.querySelector(`[${HIGHLIGHT}]`);
}

async function expectHighlighted(locator: Locator) {
  await expect.element(locator).toHaveAttribute(HIGHLIGHT);
}

describe("switch scanning", () => {
  let speech: ReturnType<typeof stubSpeech>;

  beforeEach(() => {
    speech = stubSpeech();
  });

  test("leaves Space to the focused tile while scanning is off", async () => {
    const { tile, row } = await renderBoard();

    tile("world").element().focus();
    await userEvent.keyboard("{Space}");

    await vi.waitFor(() => expect(speech.spokenTexts()).toEqual(["world"]));
    await expect.element(row(0)).not.toHaveAttribute(HIGHLIGHT);
  });

  describe("step scan", () => {
    beforeEach(() => {
      setScanningEnabled(true);
      setScanMethod("step");
    });

    test("starts at the first row and skips disabled controls", async () => {
      const { row, screen } = await renderBoard();

      await userEvent.keyboard("{Space}");

      await expectHighlighted(row(0));
      await expectNoA11yViolations(screen.container);
    });

    test("moves with Space and selects a tile in a row with Enter", async () => {
      const { tile, row, play } = await renderBoard();

      await userEvent.keyboard("{Space}{Space}");
      await expectHighlighted(row(1));

      await userEvent.keyboard("{Enter}");
      await expectHighlighted(tile("yes"));

      await userEvent.keyboard("{Space}{Enter}");

      await vi.waitFor(() => expect(speech.spokenTexts()).toEqual(["no"]));
      // The scan restarts on the updated board, where Play is now first.
      await expectHighlighted(play);
      await expect.element(tile("no")).not.toHaveAttribute(HIGHLIGHT);
    });

    test("does not activate the focused tile when a switch is pressed", async () => {
      const { tile } = await renderBoard();

      tile("hello").element().focus();
      await userEvent.keyboard("{Space}{Enter}{Space}{Enter}");

      await vi.waitFor(() => expect(speech.spokenTexts()).toEqual(["world"]));
    });

    test("leaves a row through the exit step after its last tile", async () => {
      const { tile, row } = await renderBoard();

      await userEvent.keyboard("{Space}{Enter}{Space}{Space}");
      await expectHighlighted(row(0));
      await expect.element(tile("world")).not.toHaveAttribute(HIGHLIGHT);

      await userEvent.keyboard("{Enter}{Space}");

      await expectHighlighted(row(1));
      expect(speech.spokenTexts()).toEqual([]);
    });

    test("scans every target one at a time in the linear pattern", async () => {
      setScanPattern("linear");
      const { tile } = await renderBoard();

      await userEvent.keyboard("{Space}");
      await expectHighlighted(tile("hello"));

      await userEvent.keyboard("{Space}{Space}");
      await expectHighlighted(tile("yes"));

      await userEvent.keyboard("{Enter}");

      await vi.waitFor(() => expect(speech.spokenTexts()).toEqual(["yes"]));
    });

    test("selects Play and Backspace once the message has content", async () => {
      // Wide enough for Backspace to sit above the grid, right after Play.
      const { innerWidth, innerHeight } = window;
      onTestFinished(() => page.viewport(innerWidth, innerHeight));
      await page.viewport(1024, 768);
      const { screen, tile, play, backspace } = await renderBoard();
      await tile("hello").click();
      speech.speak.mockClear();

      await userEvent.keyboard("{Space}");
      await expectHighlighted(play);

      await userEvent.keyboard("{Enter}");
      await vi.waitFor(() => expect(speech.spokenTexts()).toEqual(["hello"]));

      await userEvent.keyboard("{Space}");
      await expectHighlighted(backspace);

      await userEvent.keyboard("{Enter}");

      // Backspace removes one character from a text-only message part.
      await expect
        .element(screen.getByText("hell", { exact: true }))
        .toBeVisible();
    });

    test("ignores a repeated press within the set delay", async () => {
      setRepeatPressDelay(2);
      const { row } = await renderBoard();

      await userEvent.keyboard("{Space}{Space}");

      await expect.element(row(0)).toHaveAttribute(HIGHLIGHT);
    });

    test("times repeated presses per switch, so Select can follow Next at once", async () => {
      setRepeatPressDelay(2);
      const { tile } = await renderBoard();

      await userEvent.keyboard("{Space}{Enter}");

      await expect.element(tile("hello")).toHaveAttribute(HIGHLIGHT);
    });

    test("leaves the keys to a control outside the board that was reached with Tab", async () => {
      const outside = addOutsideButton();
      const { screen } = await renderBoard();

      const before = addOutsideButton();

      before.element.focus();
      await userEvent.tab();
      expect(document.activeElement).toBe(outside.element);
      await userEvent.keyboard("{Enter}{Space}");

      expect(outside.onClick).toHaveBeenCalledTimes(2);
      expect(findHighlighted(screen.container)).toBeNull();
    });

    test("scans when focus reached a control outside the board without Tab", async () => {
      const outside = addOutsideButton();
      const { row } = await renderBoard();

      // As when a closing drawer returns focus to the button that opened it.
      outside.element.focus();
      await userEvent.keyboard("{Enter}");

      await expect.element(row(0)).toHaveAttribute(HIGHLIGHT);
      expect(outside.onClick).not.toHaveBeenCalled();
    });

    test("leaves the keys alone while an overlay hides the board", async () => {
      const { screen, tile } = await renderBoard();
      const hello = tile("hello").element();
      // What MUI does to the app root while a dialog, drawer, or menu is open.
      screen.container.setAttribute("aria-hidden", "true");

      hello.focus();
      await userEvent.keyboard("{Space}");

      await vi.waitFor(() => expect(speech.spokenTexts()).toEqual(["hello"]));
      expect(findHighlighted(screen.container)).toBeNull();
    });

    test("clears the highlight when scanning is turned off", async () => {
      const { row } = await renderBoard();
      await userEvent.keyboard("{Space}");
      await expectHighlighted(row(0));

      setScanningEnabled(false);

      await expect.element(row(0)).not.toHaveAttribute(HIGHLIGHT);
    });
  });

  describe("auto scan", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      setScanningEnabled(true);
      setScanTime(1);
      setFirstItemDelay(0.5);
    });

    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    test("moves the highlight on its own and selects with either switch", async () => {
      const { tile, row } = await renderBoard();

      await userEvent.keyboard("{Enter}");
      await expectHighlighted(row(0));

      vi.advanceTimersByTime(1000);
      await expectHighlighted(row(0));

      vi.advanceTimersByTime(500);
      await expectHighlighted(row(1));

      await userEvent.keyboard("{Space}");
      await expectHighlighted(tile("yes"));

      vi.advanceTimersByTime(1500);
      await expectHighlighted(tile("no"));

      await userEvent.keyboard("{Enter}");

      await vi.waitFor(() => expect(speech.spokenTexts()).toEqual(["no"]));
    });

    test("pauses after the set number of scans until the next press", async () => {
      setScanCount(1);
      const { row } = await renderBoard();

      await userEvent.keyboard("{Space}");
      vi.advanceTimersByTime(1500);
      await expectHighlighted(row(1));

      vi.advanceTimersByTime(1000);
      await expect.element(row(1)).not.toHaveAttribute(HIGHLIGHT);
      await expect.element(row(0)).not.toHaveAttribute(HIGHLIGHT);

      await userEvent.keyboard("{Space}");

      await expectHighlighted(row(0));
    });

    test("pauses when an overlay hides the board", async () => {
      const { screen, row } = await renderBoard();
      await userEvent.keyboard("{Space}");
      await expectHighlighted(row(0));

      screen.container.setAttribute("aria-hidden", "true");
      vi.advanceTimersByTime(1500);

      expect(findHighlighted(screen.container)).toBeNull();
    });
  });
});
