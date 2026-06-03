import { AppProviders } from "@app/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { TEST_IMAGE_SRC } from "@shared/testing/fixtures";
import { stubAudio, stubSpeech } from "@shared/testing/device-output";
import type { OBFBoard } from "@shayc/open-board-format";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { BoardViewer } from "./board-viewer";
import { obfToBoard } from "./obf/obf-to-board";

const TWO_TILE_BOARD: OBFBoard = {
  format: "open-board-0.1",
  id: "test-board",
  locale: "en",
  buttons: [
    { id: "btn-1", label: "hello" },
    { id: "btn-2", label: "world" },
  ],
  grid: { rows: 1, columns: 2, order: [["btn-1", "btn-2"]] },
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

function renderBoardViewer(obfBoard: OBFBoard) {
  return render(
    <MemoryRouter>
      <AppProviders>
        <div style={{ height: "100vh" }}>
          <BoardViewer board={obfToBoard(obfBoard)} />
        </div>
      </AppProviders>
    </MemoryRouter>,
  );
}

describe("BoardViewer", () => {
  let speech: ReturnType<typeof stubSpeech>;

  beforeEach(() => {
    speech = stubSpeech();
    stubAudio();
  });

  test("composing tiles and pressing play speaks the merged message", async () => {
    const screen = await renderBoardViewer(TWO_TILE_BOARD);

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

  test("names the tile grid with the board's name", async () => {
    const namedBoard: OBFBoard = { ...TWO_TILE_BOARD, name: "Core words" };

    const screen = await renderBoardViewer(namedBoard);

    await expect
      .element(screen.getByRole("grid", { name: "Core words" }))
      .toBeVisible();
  });

  test("falls back to a generic grid name when the board is unnamed", async () => {
    const screen = await renderBoardViewer(TWO_TILE_BOARD);

    await expect
      .element(screen.getByRole("grid", { name: "Communication board" }))
      .toBeVisible();
  });

  test("has no accessibility violations", async () => {
    const screen = await renderBoardViewer(TWO_TILE_BOARD);

    await expectNoA11yViolations(screen.container);
  });

  test("has no accessibility violations with a composed message", async () => {
    const screen = await renderBoardViewer(PICTOGRAM_BOARD);

    await screen.getByRole("button", { name: "hello" }).click();
    await screen.getByRole("button", { name: "world" }).click();

    await expectNoA11yViolations(screen.container);
  });
});
