import { obfToBoard } from "@features/library/testing";
import { AppProviders } from "@shared/providers/app-providers";
import type { ReviewedIncomplete } from "@shared/testing/axe";
import type { OBFBoard } from "@shayc/open-board-format";
import { type InitialEntry, MemoryRouter } from "react-router";
import { render } from "vitest-browser-react";
import { CommunicationBoard } from "../communication-board";

export const EMPTY_MESSAGE_REVIEW: ReviewedIncomplete = {
  rule: "aria-required-children",
  cause: "aria-required-children",
  selector: "[role='list'][aria-label='Message']",
  reason:
    "The message list starts empty and gains an item for each selected tile.",
};

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

export function communicationBoardTree(
  obfBoard: OBFBoard,
  initialEntries: InitialEntry[] = ["/"],
  rootBoardId?: string,
) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <AppProviders>
        <div style={{ height: "100vh" }}>
          <CommunicationBoard
            board={obfToBoard(obfBoard)}
            boardLanguage={obfBoard.locale}
            rootBoardId={rootBoardId}
          />
        </div>
      </AppProviders>
    </MemoryRouter>
  );
}

export function renderCommunicationBoard(
  obfBoard: OBFBoard,
  initialEntries: InitialEntry[] = ["/"],
  rootBoardId?: string,
) {
  return render(communicationBoardTree(obfBoard, initialEntries, rootBoardId));
}
