import { AppProviders } from "@app/app-providers";
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

describe("BoardViewer", () => {
  let speech: ReturnType<typeof stubSpeech>;

  beforeEach(() => {
    speech = stubSpeech();
    stubAudio();
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
    // useButtonActivation speaks per-tile feedback; we only assert the play call.
    speech.speak.mockClear();

    await screen.getByRole("button", { name: "Play message" }).click();

    await vi.waitFor(() => {
      expect(speech.speak.mock.calls).toHaveLength(1);
      expect(speech.speak.mock.calls[0][0].text).toBe("hello world");
    });
  });
});
