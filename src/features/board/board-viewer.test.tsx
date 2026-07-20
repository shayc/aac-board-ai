import {
  setSwitchScanningEnabled,
  setSwitchInput,
  setSwitchScanningMethod,
} from "@shared/switch-scanning/switch-scanning-store";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { assertDefined } from "@shared/testing/assert-defined";
import {
  makeProofreadResult,
  stubBuiltInAIUnsupported,
  stubProofreader,
} from "@shared/testing/built-in-ai";
import { stubAudio } from "@shared/testing/stub-audio";
import { stubSpeech } from "@shared/testing/stub-speech";
import type { OBFBoard } from "@shayc/open-board-format";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { renderBoardViewer, TWO_BUTTON_BOARD } from "./test-utils";
import { seedBoardSets, TEST_IMAGE_SRC } from "./testing";

const SPELL_THEN_SPEAK_BOARD: OBFBoard = {
  format: "open-board-0.1",
  id: "spell-then-speak-board",
  locale: "en",
  buttons: [{ id: "btn-1", label: "S", actions: ["+s", ":speak"] }],
  grid: { rows: 1, columns: 1, order: [["btn-1"]] },
};

const PICTOGRAM_BOARD: OBFBoard = {
  format: "open-board-0.1",
  id: "pictogram-board",
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

const ROW_SCAN_BOARD: OBFBoard = {
  format: "open-board-0.1",
  id: "row-scan-board",
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

function pressMouseSwitch(button: number): void {
  document.body.dispatchEvent(
    new MouseEvent("mousedown", { bubbles: true, button }),
  );
  document.body.dispatchEvent(
    new MouseEvent("mouseup", { bubbles: true, button }),
  );
}

describe("BoardViewer", () => {
  let speech: ReturnType<typeof stubSpeech>;

  beforeEach(() => {
    speech = stubSpeech();
    stubAudio();
  });

  test("composing tiles and pressing play speaks the merged message", async () => {
    const screen = await renderBoardViewer(TWO_BUTTON_BOARD);

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
    const screen = await renderBoardViewer(TWO_BUTTON_BOARD);

    await screen.getByRole("button", { name: "hello" }).click();

    await expect
      .element(screen.getByRole("button", { name: "Play message" }))
      .toBeVisible();
  });

  test("enables message playback only after content is composed", async () => {
    const screen = await renderBoardViewer(TWO_BUTTON_BOARD);
    const play = screen.getByRole("button", { name: "Play message" });

    await expect.element(play).toBeDisabled();

    await screen.getByRole("button", { name: "hello" }).click();

    await expect.element(play).toBeEnabled();
  });

  test("a button that spells then speaks in one tap speaks the spelled letter", async () => {
    const screen = await renderBoardViewer(SPELL_THEN_SPEAK_BOARD);

    await screen.getByRole("button", { name: "S", exact: true }).click();

    await vi.waitFor(() => {
      expect(speech.speak.mock.calls).toHaveLength(1);
      expect(speech.speak.mock.calls[0][0].text).toBe("s");
    });
  });

  test("names the tile grid with the board's name", async () => {
    const namedBoard: OBFBoard = { ...TWO_BUTTON_BOARD, name: "Core words" };

    const screen = await renderBoardViewer(namedBoard);

    await expect
      .element(screen.getByRole("grid", { name: "Core words" }))
      .toBeVisible();
  });

  test("does not scroll the grid when Home navigates to the home board", async () => {
    await seedBoardSets([{ setId: "set-1", rootBoardId: "root-board" }]);

    const screen = await renderBoardViewer(LARGE_GRID_BOARD, [
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

    await screen.getByRole("button", { name: "Home" }).click();

    expect(scrollContainer.scrollLeft).toBeGreaterThan(0);
    expect(scrollContainer.scrollTop).toBeGreaterThan(0);
  });

  test("scrolls the grid to both origins when Home is clicked from Home", async () => {
    await seedBoardSets([{ setId: "set-1", rootBoardId: "root-board" }]);

    const screen = await renderBoardViewer(LARGE_GRID_BOARD, [
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

    await screen.getByRole("button", { name: "Home" }).click();

    await vi.waitFor(() => {
      expect(scrollContainer.scrollLeft).toBe(0);
      expect(scrollContainer.scrollTop).toBe(0);
    });
  });

  test("falls back to a generic grid name when the board is unnamed", async () => {
    const screen = await renderBoardViewer(TWO_BUTTON_BOARD);

    await expect
      .element(screen.getByRole("grid", { name: "Communication board" }))
      .toBeVisible();
  });

  test("two-switch scanning selects a row before moving through its tiles", async () => {
    setSwitchScanningEnabled(true);
    setSwitchScanningMethod("step");

    const screen = await renderBoardViewer(ROW_SCAN_BOARD);
    const firstRow = screen.getByRole("row").nth(0);
    const secondRow = screen.getByRole("row").nth(1);
    const yes = screen.getByRole("button", { name: "yes", exact: true });
    const no = screen.getByRole("button", { name: "no", exact: true });

    await userEvent.keyboard("{Space}");
    await expect.element(firstRow).toHaveAttribute("data-scan-highlighted");

    await userEvent.keyboard("{Space}");
    await expect.element(secondRow).toHaveAttribute("data-scan-highlighted");

    await userEvent.keyboard("{Enter}");
    await expect.element(yes).toHaveAttribute("data-scan-highlighted");
    await expect.element(secondRow).toHaveAttribute("data-scan-within");

    await userEvent.keyboard("{Space}");
    await expect.element(no).toHaveAttribute("data-scan-highlighted");

    await userEvent.keyboard("{Enter}");

    await vi.waitFor(() => {
      expect(speech.speak).toHaveBeenCalledTimes(1);
      expect(speech.speak.mock.calls[0][0].text).toBe("no");
    });
  });

  test("drives scanning with assigned mouse buttons", async () => {
    setSwitchScanningEnabled(true);
    setSwitchScanningMethod("step");
    setSwitchInput("next", { kind: "mouse", button: 3 });
    setSwitchInput("select", { kind: "mouse", button: 4 });

    const screen = await renderBoardViewer(ROW_SCAN_BOARD);
    const firstRow = screen.getByRole("row").nth(0);
    const secondRow = screen.getByRole("row").nth(1);
    const yes = screen.getByRole("button", { name: "yes", exact: true });

    pressMouseSwitch(3);
    await expect.element(firstRow).toHaveAttribute("data-scan-highlighted");

    pressMouseSwitch(3);
    await expect.element(secondRow).toHaveAttribute("data-scan-highlighted");

    pressMouseSwitch(4);
    await expect.element(yes).toHaveAttribute("data-scan-highlighted");
  });

  test("scans navigation and backspace as top-level targets", async () => {
    await seedBoardSets([{ setId: "set-1", rootBoardId: "root-board" }]);
    setSwitchScanningEnabled(true);
    setSwitchScanningMethod("step");

    const screen = await renderBoardViewer(TWO_BUTTON_BOARD, [
      {
        pathname: "/sets/set-1/boards/other-board",
        state: { backStack: ["root-board"] },
      },
    ]);
    const play = screen.getByRole("button", { name: "Play message" });
    const back = screen.getByRole("button", { name: "Go back" });
    const home = screen.getByRole("button", { name: "Go home" });
    const backspace = screen.getByRole("button", { name: "Backspace" });

    await screen.getByRole("button", { name: "hello" }).click();
    await expect.element(backspace).toBeEnabled();

    expect(back.element().closest("[data-scan-group]")).toBeNull();
    expect(home.element().closest("[data-scan-group]")).toBeNull();
    expect(backspace.element().closest("[data-scan-group]")).toBeNull();

    await userEvent.keyboard("{Space}");
    await expect.element(play).toHaveAttribute("data-scan-highlighted");

    await userEvent.keyboard("{Space}");
    if (!back.element().hasAttribute("data-scan-highlighted")) {
      // On small screens the tile grid precedes the actions toolbar.
      await userEvent.keyboard("{Space}");
    }
    await expect.element(back).toHaveAttribute("data-scan-highlighted");

    await userEvent.keyboard("{Space}");
    await expect.element(home).toHaveAttribute("data-scan-highlighted");

    await userEvent.keyboard("{Space}");
    await expect.element(backspace).toHaveAttribute("data-scan-highlighted");
  });

  test("scans generated suggestions as top-level targets", async () => {
    stubProofreader(() => makeProofreadResult("Corrected hello"));
    stubBuiltInAIUnsupported("Rewriter");
    setSwitchScanningEnabled(true);
    setSwitchScanningMethod("step");

    const screen = await renderBoardViewer(TWO_BUTTON_BOARD);

    await screen.getByRole("button", { name: "hello" }).click();

    const suggestion = screen.getByRole("button", {
      name: "Corrected hello",
    });
    await expect.element(suggestion).toBeVisible();

    expect(suggestion.element().closest("[data-scan-group]")).toBeNull();

    await userEvent.keyboard("{Space}");
    await userEvent.keyboard("{Space}");
    await expect.element(suggestion).toHaveAttribute("data-scan-highlighted");
  });

  test("shows the active row and tile clearly in light and dark themes", async () => {
    setSwitchScanningEnabled(true);
    setSwitchScanningMethod("step");

    const originalThemeClasses = document.documentElement.className;

    try {
      setThemeMode("light");

      const screen = await renderBoardViewer(ROW_SCAN_BOARD);
      const firstRow = screen.getByRole("row").nth(0);
      const hello = screen.getByRole("button", {
        name: "hello",
        exact: true,
      });

      await userEvent.keyboard("{Space}");

      const lightRowStyles = getComputedStyle(firstRow.element());
      expect(lightRowStyles.outlineStyle).toBe("solid");
      expect(lightRowStyles.outlineWidth).toBe("4px");
      expect(lightRowStyles.boxShadow).not.toBe("none");

      await userEvent.keyboard("{Enter}");

      const lightTileStyles = getComputedStyle(hello.element());
      const lightOutlineColor = lightTileStyles.outlineColor;
      expect(lightTileStyles.outlineStyle).toBe("solid");
      expect(lightTileStyles.outlineWidth).toBe("4px");
      expect(lightTileStyles.boxShadow).not.toBe("none");
      expect(getComputedStyle(firstRow.element()).outlineStyle).toBe("dashed");

      setThemeMode("dark");

      await vi.waitFor(() => {
        expect(getComputedStyle(hello.element()).outlineColor).not.toBe(
          lightOutlineColor,
        );
      });

      const darkTileStyles = getComputedStyle(hello.element());
      expect(darkTileStyles.outlineStyle).toBe("solid");
      expect(darkTileStyles.outlineWidth).toBe("4px");
      expect(darkTileStyles.boxShadow).not.toBe("none");
      expect(getComputedStyle(firstRow.element()).outlineStyle).toBe("dashed");
    } finally {
      document.documentElement.className = originalThemeClasses;
    }
  });

  test("leaves native Space activation intact while switch scanning is off", async () => {
    const screen = await renderBoardViewer(TWO_BUTTON_BOARD);
    const hello = screen.getByRole("button", { name: "hello" });

    hello.element().focus();
    await userEvent.keyboard("{Space}");

    await vi.waitFor(() => {
      expect(speech.speak).toHaveBeenCalledTimes(1);
      expect(speech.speak.mock.calls[0][0].text).toBe("hello");
    });
  });

  test("scanning the enable chip starts the suggestion model download", async () => {
    const proofreader = stubProofreader();
    proofreader.availability.mockResolvedValue("downloadable");
    stubBuiltInAIUnsupported("Rewriter");
    setSwitchScanningEnabled(true);
    setSwitchScanningMethod("step");

    const screen = await renderBoardViewer(TWO_BUTTON_BOARD);
    const enableSuggestions = screen.getByRole("button", {
      name: "Enable suggestions",
    });

    await expect.element(enableSuggestions).toBeVisible();

    expect(enableSuggestions.element().closest("[data-scan-group]")).toBeNull();

    await userEvent.keyboard("{Space}");
    await expect
      .element(enableSuggestions)
      .toHaveAttribute("data-scan-highlighted");

    await userEvent.keyboard("{Enter}");

    await vi.waitFor(() => {
      expect(proofreader.create).toHaveBeenCalled();
    });
  });

  test("has no accessibility violations", async () => {
    const screen = await renderBoardViewer(TWO_BUTTON_BOARD);

    await expectNoA11yViolations(screen.container);
  });

  test("has no accessibility violations with a composed message", async () => {
    const screen = await renderBoardViewer(PICTOGRAM_BOARD);

    await screen.getByRole("button", { name: "hello" }).click();
    await screen.getByRole("button", { name: "world" }).click();

    await expectNoA11yViolations(screen.container);
  });
});

function setThemeMode(mode: "light" | "dark"): void {
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(mode);
}
