import Dialog from "@mui/material/Dialog";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { stubSpeech } from "@shared/testing/stub-speech";
import type { OBFBoard } from "@shayc/open-board-format";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
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

// Assert each move before advancing again so React can schedule the next interval.
async function advanceScanInterval() {
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

      await advanceScanInterval();
      await expect.poll(highlightedNames).toEqual(["more", "stop"]);

      await advanceScanInterval();
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);
    });

    test("pauses after two passes without a selection, until the next press", async () => {
      await renderCommunicationBoard(TWO_ROW_BOARD);

      await pressSwitch();
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);

      await advanceScanInterval();
      await expect.poll(highlightedNames).toEqual(["more", "stop"]);

      await advanceScanInterval();
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);

      await advanceScanInterval();
      await expect.poll(highlightedNames).toEqual(["more", "stop"]);

      await advanceScanInterval();
      await expect.poll(highlightedNames).toEqual([]);

      await pressSwitch("Enter");
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);
    });

    test("scans the tiles of the selected row and speaks the selected tile", async () => {
      await renderCommunicationBoard(TWO_ROW_BOARD);

      await pressSwitch();
      await advanceScanInterval();
      await expect.poll(highlightedNames).toEqual(["more", "stop"]);

      await pressSwitch();
      await expect.poll(highlightedNames).toEqual(["more"]);

      await advanceScanInterval();
      await expect.poll(highlightedNames).toEqual(["stop"]);

      await pressSwitch();

      await vi.waitFor(() => {
        expect(speech.spokenTexts()).toEqual(["stop"]);
      });
    });

    test("highlights the row again after its last tile, as a step that leaves it", async () => {
      await renderCommunicationBoard(TWO_ROW_BOARD);

      await pressSwitch();
      await pressSwitch();
      await expect.poll(highlightedNames).toEqual(["yes"]);

      await advanceScanInterval();
      await expect.poll(highlightedNames).toEqual(["no"]);

      await advanceScanInterval();
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);

      await pressSwitch();
      await advanceScanInterval();
      await expect.poll(highlightedNames).toEqual(["more", "stop"]);
    });

    test("moves on to the next row after two passes over a row's tiles", async () => {
      await renderCommunicationBoard(TWO_ROW_BOARD);

      await pressSwitch();
      await pressSwitch();
      await expect.poll(highlightedNames).toEqual(["yes"]);

      await advanceScanInterval();
      await expect.poll(highlightedNames).toEqual(["no"]);

      await advanceScanInterval();
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);

      await advanceScanInterval();
      await expect.poll(highlightedNames).toEqual(["yes"]);

      await advanceScanInterval();
      await expect.poll(highlightedNames).toEqual(["no"]);

      await advanceScanInterval();
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);

      await advanceScanInterval();
      await expect.poll(highlightedNames).toEqual(["more", "stop"]);
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

      await advanceScanInterval();
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);

      await advanceScanInterval();
      await expect.poll(highlightedNames).toEqual(["more", "stop"]);

      await advanceScanInterval();
      await expect.poll(highlightedNames).toEqual(["Backspace"]);

      await pressSwitch();

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

      await advanceScanInterval();
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
      await advanceScanInterval();

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

    test("leaves a row through the exit step after its last tile", async () => {
      await renderCommunicationBoard(TWO_ROW_BOARD);

      await pressSwitch("Space");
      await pressSwitch("Enter");
      await expect.poll(highlightedNames).toEqual(["yes"]);

      await pressSwitch("Space");
      await expect.poll(highlightedNames).toEqual(["no"]);

      await pressSwitch("Space");
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);

      await pressSwitch("Enter");
      await pressSwitch("Space");
      await expect.poll(highlightedNames).toEqual(["more", "stop"]);
      expect(speech.spokenTexts()).toEqual([]);
    });

    test("keeps cycling through a row's tiles until the exit step is selected", async () => {
      await renderCommunicationBoard(TWO_ROW_BOARD);

      await pressSwitch("Space");
      await pressSwitch("Enter");
      await expect.poll(highlightedNames).toEqual(["yes"]);

      for (let pass = 0; pass < 3; pass++) {
        await pressSwitch("Space");
        await expect.poll(highlightedNames).toEqual(["no"]);

        await pressSwitch("Space");
        await expect.poll(highlightedNames).toEqual(["yes", "no"]);

        await pressSwitch("Space");
        await expect.poll(highlightedNames).toEqual(["yes"]);
      }
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

      await userEvent.keyboard("{Tab}{Tab}");
      await expect
        .element(screen.getByRole("button", { name: "yes" }))
        .toHaveFocus();
      expect(getComputedStyle(yes).outlineStyle).toBe("solid");

      await pressSwitch("Space");
      await pressSwitch("Space");
      await expect.poll(highlightedNames).toEqual(["more", "stop"]);

      expect(getComputedStyle(yes).outlineStyle).toBe("none");
    });

    test("hides the keyboard focus ring of the message while a tile is highlighted", async () => {
      setScanningEnabled(false);
      const screen = await renderCommunicationBoard(TWO_ROW_BOARD);
      const message = screen.getByRole("list", { name: "Message" });

      await userEvent.keyboard("{Tab}{Tab}{Enter}");
      await expect.element(message.getByText("yes")).toBeVisible();
      message.element().focus();
      expect(getComputedStyle(message.element()).outlineStyle).toBe("solid");

      setScanningEnabled(true);
      await pressSwitch("Space");
      await pressSwitch("Space");
      await expect.poll(highlightedNames).toEqual(["yes", "no"]);

      expect(getComputedStyle(message.element()).outlineStyle).toBe("none");
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
