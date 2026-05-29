import { AppProviders } from "@app/app-providers";
import { stubAudio, stubSpeech } from "@shared/testing/device-output";
import type { OBFBoard } from "@shayc/open-board-format";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { BoardViewer } from "../board-viewer";
import { obfToBoard } from "../obf/obf-to-board";

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

async function renderBoard() {
  return render(
    <MemoryRouter>
      <AppProviders>
        <div style={{ height: "100vh" }}>
          <BoardViewer board={obfToBoard(TWO_TILE_BOARD)} />
        </div>
      </AppProviders>
    </MemoryRouter>,
  );
}

describe("board keyboard shortcuts", () => {
  let speech: ReturnType<typeof stubSpeech>;

  beforeEach(() => {
    speech = stubSpeech();
    stubAudio();
  });

  test("Backspace from a focused tile removes the last message part", async () => {
    const screen = await renderBoard();
    await screen.getByRole("button", { name: "hello" }).click();
    await screen.getByRole("button", { name: "world" }).click();

    // The key must bubble past the grid's handler (which stops propagation by
    // default) to the board root.
    screen.getByRole("button", { name: "world" }).element().focus();
    await userEvent.keyboard("{Backspace}");

    speech.speak.mockClear();
    await screen.getByRole("button", { name: "Play message" }).click();

    await vi.waitFor(() => {
      expect(speech.speak.mock.calls).toHaveLength(1);
      expect(speech.speak.mock.calls[0][0].text).toBe("hello");
    });
  });

  test("Backspace works board-wide — even from a non-grid button", async () => {
    const screen = await renderBoard();
    await screen.getByRole("button", { name: "hello" }).click();
    await screen.getByRole("button", { name: "world" }).click();

    screen.getByRole("button", { name: "Play message" }).element().focus();
    await userEvent.keyboard("{Backspace}");

    speech.speak.mockClear();
    await screen.getByRole("button", { name: "Play message" }).click();

    await vi.waitFor(() => {
      expect(speech.speak.mock.calls[0][0].text).toBe("hello");
    });
  });

  test("⌘+Enter speaks the message", async () => {
    const screen = await renderBoard();
    await screen.getByRole("button", { name: "hello" }).click();
    await screen.getByRole("button", { name: "world" }).click();

    speech.speak.mockClear();
    screen.getByRole("button", { name: "world" }).element().focus();
    await userEvent.keyboard("{Meta>}{Enter}{/Meta}");

    await vi.waitFor(() => {
      expect(speech.speak.mock.calls).toHaveLength(1);
      expect(speech.speak.mock.calls[0][0].text).toBe("hello world");
    });
  });
});
