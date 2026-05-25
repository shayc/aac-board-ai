import { AppProviders } from "@app/app-providers";
import { stubAudio, stubSpeech } from "@shared/testing/device-output";
import lotsOfStuffRaw from "@shared/testing/sample-boards/lots-of-stuff.obf?raw";
import type { OBFBoard } from "open-board-format";
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

const LOTS_OF_STUFF = JSON.parse(lotsOfStuffRaw) as OBFBoard;

describe("BoardViewer", () => {
  let speech: ReturnType<typeof stubSpeech>;
  let audio: ReturnType<typeof stubAudio>;

  beforeEach(() => {
    speech = stubSpeech();
    audio = stubAudio();
  });

  test("composing tiles and pressing play speaks the merged message", async () => {
    const screen = await render(
      <MemoryRouter>
        <AppProviders>
          <div style={{ height: "100vh" }}>
            <BoardViewer board={obfToBoard(TWO_TILE_BOARD)} />
          </div>
        </AppProviders>
      </MemoryRouter>,
    );

    await screen.getByRole("button", { name: "hello" }).click();
    await screen.getByRole("button", { name: "world" }).click();
    // Discard the per-tile audio-feedback speech so the next assertion only
    // sees what the play button produces.
    speech.speak.mockClear();

    await screen.getByRole("button", { name: "Play message" }).click();

    await vi.waitFor(() => {
      expect(speech.speak.mock.calls).toHaveLength(1);
      expect(speech.speak.mock.calls[0][0].text).toBe("hello world");
    });
  });

  test("renders a complex board and takes the sound path for buttons with both sound and image", async () => {
    const screen = await render(
      <MemoryRouter>
        <AppProviders>
          <div style={{ height: "100vh" }}>
            <BoardViewer board={obfToBoard(LOTS_OF_STUFF)} />
          </div>
        </AppProviders>
      </MemoryRouter>,
    );

    const grid = screen.getByRole("grid");
    await expect.element(grid).toHaveAttribute("aria-rowcount", "2");
    await expect.element(grid).toHaveAttribute("aria-colcount", "3");

    await expect
      .element(screen.getByRole("button", { name: "happy" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "sad" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Clear Text" }))
      .toBeVisible();

    await screen.getByRole("button", { name: "happy" }).click();

    expect(audio.play).toHaveBeenCalled();
    expect(speech.speak).not.toHaveBeenCalled();
  });
});
