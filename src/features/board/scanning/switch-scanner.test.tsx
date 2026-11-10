import Dialog from "@mui/material/Dialog";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { stubSpeech } from "@shared/testing/stub-speech";
import type { OBFBoard } from "@shayc/open-board-format";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  communicationBoardTree,
  renderCommunicationBoard,
} from "../testing/render-communication-board";
import { SCAN_HIGHLIGHTED_ITEM_SELECTOR, scanGroupProps } from "./scan-targets";
import {
  setScanIntervalMs,
  setScanMethod,
  setScanningEnabled,
} from "./scanning-preferences-store";
import { ScanningScope } from "./scanning-scope";

const SCAN_INTERVAL_MS = 1000;

const TWO_ROW_BOARD: OBFBoard = {
  format: "open-board-0.1",
  id: "two-row-board",
  locale: "en",
  buttons: [
    { id: "yes", label: "yes" },
    { id: "no", label: "no" },
    { id: "more", label: "more" },
    { id: "stop", label: "stop" },
  ],
  grid: {
    rows: 2,
    columns: 2,
    order: [
      ["yes", "no"],
      ["more", "stop"],
    ],
  },
};

const OTHER_TWO_ROW_BOARD: OBFBoard = {
  format: "open-board-0.1",
  id: "other-two-row-board",
  locale: "en",
  buttons: [
    { id: "eat", label: "eat" },
    { id: "drink", label: "drink" },
    { id: "play", label: "play" },
    { id: "sleep", label: "sleep" },
  ],
  grid: {
    rows: 2,
    columns: 2,
    order: [
      ["eat", "drink"],
      ["play", "sleep"],
    ],
  },
};

function navigationGroupTree(canGoBack: boolean) {
  return (
    <AppProviders>
      <ScanningScope>
        <div {...scanGroupProps}>
          <button disabled={!canGoBack}>back</button>
          <button>home</button>
        </div>
        <div {...scanGroupProps}>
          <button>yes</button>
        </div>
      </ScanningScope>
    </AppProviders>
  );
}

const appendedElements: HTMLElement[] = [];

function appendToBody<TagName extends keyof HTMLElementTagNameMap>(
  tagName: TagName,
): HTMLElementTagNameMap[TagName] {
  const element = document.createElement(tagName);
  document.body.append(element);
  appendedElements.push(element);

  return element;
}

function highlightedNames(): string[] {
  return Array.from(
    document.querySelectorAll(SCAN_HIGHLIGHTED_ITEM_SELECTOR),
    (target) => target.getAttribute("aria-label") ?? target.textContent,
  );
}

async function pressSwitch(key: "Space" | "Enter" = "Space") {
  await userEvent.keyboard(`{${key}}`);
}

// One interval at a time: the next interval starts only once React has
// committed the move, so assert each move before advancing again.
async function waitScanInterval() {
  await vi.advanceTimersByTimeAsync(SCAN_INTERVAL_MS);
}

describe("switch scanning", () => {
  let speech: ReturnType<typeof stubSpeech>;

  beforeEach(() => {
    speech = stubSpeech();
    setScanIntervalMs(SCAN_INTERVAL_MS);
  });

  afterEach(() => {
    for (const element of appendedElements.splice(0)) {
      element.remove();
    }
  });

  test("leaves the board alone while scanning is off", async () => {
    const screen = await renderCommunicationBoard(TWO_ROW_BOARD);
    const no = screen.getByRole("button", { name: "no" });

    no.element().focus();
    await pressSwitch();

    await vi.waitFor(() => {
      expect(speech.spokenTexts()).toEqual(["no"]);
    });
    expect(highlightedNames()).toEqual([]);
  });

  describe("automatic scan", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      setScanningEnabled(true);
    });

    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    test("waits for a switch press, then highlights the first row", async () => {
      await renderCommunicationBoard(TWO_ROW_BOARD);

      await vi.advanceTimersByTimeAsync(3 * SCAN_INTERVAL_MS);
      expect(highlightedNames()).toEqual([]);

      await pressSwitch();

      await expect.poll(highlightedNames).toEqual(["yes", "no"]);
    });

    test("outlines the highlighted tiles", async () => {
      const screen = await renderCommunicationBoard(TWO_ROW_BOARD);
      const yes = screen.getByRole("button", { name: "yes" }).element();
      const more = screen.getByRole("button", { name: "more" }).element();

      await pressSwitch();
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);

      expect(getComputedStyle(yes).outlineStyle).toBe("solid");
      expect(getComputedStyle(more).outlineStyle).not.toBe("solid");
    });

    test("moves to the next row after each scan interval", async () => {
      await renderCommunicationBoard(TWO_ROW_BOARD);

      await pressSwitch();
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);

      await waitScanInterval();
      await expect.poll(highlightedNames).toEqual(["more", "stop"]);

      await waitScanInterval();
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);
    });

    test("pauses after two passes without a selection, until the next press", async () => {
      await renderCommunicationBoard(TWO_ROW_BOARD);

      await pressSwitch();
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);

      await waitScanInterval();
      await expect.poll(highlightedNames).toEqual(["more", "stop"]);

      await waitScanInterval();
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);

      await waitScanInterval();
      await expect.poll(highlightedNames).toEqual(["more", "stop"]);

      await waitScanInterval();
      await expect.poll(highlightedNames).toEqual([]);

      await pressSwitch("Enter");
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);
    });

    test("scans the tiles of the selected row and speaks the selected tile", async () => {
      await renderCommunicationBoard(TWO_ROW_BOARD);

      await pressSwitch();
      await waitScanInterval();
      await expect.poll(highlightedNames).toEqual(["more", "stop"]);

      await pressSwitch();
      await expect.poll(highlightedNames).toEqual(["more"]);

      await waitScanInterval();
      await expect.poll(highlightedNames).toEqual(["stop"]);

      await pressSwitch();

      await vi.waitFor(() => {
        expect(speech.spokenTexts()).toEqual(["stop"]);
      });
    });

    test("returns to the rows after two passes over a row's tiles", async () => {
      await renderCommunicationBoard(TWO_ROW_BOARD);

      await pressSwitch();
      await pressSwitch();
      await expect.poll(highlightedNames).toEqual(["yes"]);

      await waitScanInterval();
      await expect.poll(highlightedNames).toEqual(["no"]);

      await waitScanInterval();
      await expect.poll(highlightedNames).toEqual(["yes"]);

      await waitScanInterval();
      await expect.poll(highlightedNames).toEqual(["no"]);

      await waitScanInterval();
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);
    });

    test("restarts at the play button once the message has content", async () => {
      await renderCommunicationBoard(TWO_ROW_BOARD);

      await pressSwitch();
      await pressSwitch();
      await pressSwitch();
      await vi.waitFor(() => {
        expect(speech.spokenTexts()).toEqual(["yes"]);
      });

      await expect.poll(highlightedNames).toEqual(["Play message"]);
    });

    test("activates a highlighted control that is the only one in its group", async () => {
      await renderCommunicationBoard(TWO_ROW_BOARD);

      await pressSwitch();
      await pressSwitch();
      await pressSwitch();
      await expect.poll(highlightedNames).toEqual(["Play message"]);

      await pressSwitch();

      await vi.waitFor(() => {
        expect(speech.spokenTexts()).toEqual(["yes", "yes"]);
      });
    });

    test("reaches the board controls in document order", async () => {
      const screen = await renderCommunicationBoard(TWO_ROW_BOARD);

      await pressSwitch();
      await pressSwitch();
      await pressSwitch();
      await expect.poll(highlightedNames).toEqual(["Play message"]);

      await waitScanInterval();
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);

      await waitScanInterval();
      await expect.poll(highlightedNames).toEqual(["more", "stop"]);

      await waitScanInterval();
      await expect.poll(highlightedNames).toEqual(["Backspace"]);

      await pressSwitch();

      // Backspace removes the last character of a text-only message part.
      await expect
        .element(screen.getByText("ye", { exact: true }))
        .toBeVisible();
    });

    test("counts a held switch as one press", async () => {
      await renderCommunicationBoard(TWO_ROW_BOARD);

      await pressSwitch();
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);

      document.body.dispatchEvent(
        new KeyboardEvent("keydown", { key: " ", repeat: true, bubbles: true }),
      );

      await waitScanInterval();
      await expect.poll(highlightedNames).toEqual(["more", "stop"]);
    });

    test("keeps the switch from activating the focused tile", async () => {
      const screen = await renderCommunicationBoard(TWO_ROW_BOARD);
      const no = screen.getByRole("button", { name: "no" });

      no.element().focus();
      await pressSwitch();
      await pressSwitch("Enter");

      await expect.poll(highlightedNames).toEqual(["yes"]);
      expect(speech.spokenTexts()).toEqual([]);
    });

    test("scans when focus rests on a control outside the board", async () => {
      await renderCommunicationBoard(TWO_ROW_BOARD);
      const onClick = vi.fn();
      const outsideButton = appendToBody("button");
      outsideButton.addEventListener("click", onClick);

      outsideButton.focus();
      await pressSwitch();

      await expect.poll(highlightedNames).toEqual(["yes", "no"]);
      expect(onClick).not.toHaveBeenCalled();
    });

    test("leaves keys typed into a text field alone", async () => {
      await renderCommunicationBoard(TWO_ROW_BOARD);
      const textField = appendToBody("input");

      textField.focus();
      await userEvent.keyboard("a{Space}b");

      expect(textField.value).toBe("a b");
      expect(highlightedNames()).toEqual([]);
    });

    test("leaves switch keys to a dialog that covers the board", async () => {
      const onClose = vi.fn();
      const screen = await render(
        <>
          {communicationBoardTree(TWO_ROW_BOARD)}
          <Dialog open>
            <button onClick={onClose}>Close</button>
          </Dialog>
        </>,
      );

      screen.getByRole("button", { name: "Close" }).element().focus();
      await pressSwitch();

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(highlightedNames()).toEqual([]);
    });

    test("pauses when a dialog covers the board", async () => {
      const screen = await renderCommunicationBoard(TWO_ROW_BOARD);

      await pressSwitch();
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);

      await screen.rerender(
        <>
          {communicationBoardTree(TWO_ROW_BOARD)}
          <Dialog open>
            <button>Close</button>
          </Dialog>
        </>,
      );
      await waitScanInterval();

      await expect.poll(highlightedNames).toEqual([]);
    });

    test("removes the highlight when scanning is turned off", async () => {
      await renderCommunicationBoard(TWO_ROW_BOARD);

      await pressSwitch();
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);

      setScanningEnabled(false);

      await expect.poll(highlightedNames).toEqual([]);
    });
  });

  describe("two-switch step scan", () => {
    beforeEach(() => {
      setScanningEnabled(true);
      setScanMethod("step");
    });

    test("moves with Space and selects with Enter", async () => {
      await renderCommunicationBoard(TWO_ROW_BOARD);

      await pressSwitch("Space");
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);

      await pressSwitch("Space");
      await expect.poll(highlightedNames).toEqual(["more", "stop"]);

      await pressSwitch("Enter");
      await expect.poll(highlightedNames).toEqual(["more"]);

      await pressSwitch("Space");
      await expect.poll(highlightedNames).toEqual(["stop"]);

      await pressSwitch("Enter");

      await vi.waitFor(() => {
        expect(speech.spokenTexts()).toEqual(["stop"]);
      });
    });

    test("highlights a button that becomes enabled in the highlighted group", async () => {
      const screen = await render(navigationGroupTree(false));
      const back = screen.getByRole("button", { name: "back" }).element();

      await pressSwitch("Space");
      await expect.poll(highlightedNames).toEqual(["home"]);

      await screen.rerender(navigationGroupTree(true));

      await expect.poll(highlightedNames).toEqual(["back", "home"]);
      expect(getComputedStyle(back).outlineStyle).toBe("solid");
    });

    test("keeps the first row highlighted when another board replaces its tiles", async () => {
      const screen = await renderCommunicationBoard(TWO_ROW_BOARD);

      await pressSwitch("Space");
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);

      await screen.rerender(communicationBoardTree(OTHER_TWO_ROW_BOARD));
      await expect.poll(highlightedNames).toEqual(["eat", "drink"]);

      await pressSwitch("Space");
      await expect.poll(highlightedNames).toEqual(["play", "sleep"]);
    });

    test("hides the keyboard focus ring of another tile while a tile is highlighted", async () => {
      const screen = await renderCommunicationBoard(TWO_ROW_BOARD);
      const yes = screen.getByRole("button", { name: "yes" }).element();

      await userEvent.keyboard("{Tab}");
      await expect
        .element(screen.getByRole("button", { name: "yes" }))
        .toHaveFocus();
      expect(getComputedStyle(yes).outlineStyle).toBe("solid");

      await pressSwitch("Space");
      await pressSwitch("Space");
      await expect.poll(highlightedNames).toEqual(["more", "stop"]);

      expect(getComputedStyle(yes).outlineStyle).toBe("none");
    });

    test("keeps cycling through the rows without pausing", async () => {
      await renderCommunicationBoard(TWO_ROW_BOARD);

      for (let press = 0; press < 5; press++) {
        await pressSwitch("Space");
      }

      await expect.poll(highlightedNames).toEqual(["yes", "no"]);
    });

    test("has no accessibility violations while a row is highlighted", async () => {
      const screen = await renderCommunicationBoard(TWO_ROW_BOARD);

      await pressSwitch();
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);

      await expectNoA11yViolations(screen.container);
    });
  });
});
