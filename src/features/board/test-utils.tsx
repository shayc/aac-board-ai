import { AppProviders } from "@shared/providers/app-providers";
import type { OBFBoard } from "@shayc/open-board-format";
import { MemoryRouter } from "react-router";
import { render } from "vitest-browser-react";
import { BoardViewer } from "./board-viewer";
import { obfToBoard } from "./obf/obf-to-board";

export const TWO_BUTTON_BOARD: OBFBoard = {
  format: "open-board-0.1",
  id: "test-board",
  locale: "en",
  buttons: [
    { id: "btn-1", label: "hello" },
    { id: "btn-2", label: "world" },
  ],
  grid: { rows: 1, columns: 2, order: [["btn-1", "btn-2"]] },
};

export function renderBoardViewer(obfBoard: OBFBoard) {
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
