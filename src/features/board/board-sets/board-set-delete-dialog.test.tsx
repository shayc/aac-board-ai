import type { BoardSetRecord } from "../storage/boards-db";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { BoardSetDeleteDialog } from "./board-set-delete-dialog";

function makeBoardSet(overrides: Partial<BoardSetRecord> = {}): BoardSetRecord {
  return {
    setId: "set-1",
    name: "My Board",
    rootBoardId: "root",
    updatedAt: 0,
    boardCount: 1,
    ...overrides,
  };
}

describe("BoardSetDeleteDialog", () => {
  test("shows the board set name and an irreversible warning when open", async () => {
    const screen = await render(
      <BoardSetDeleteDialog
        boardSet={makeBoardSet({ name: "Core Words" })}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await expect
      .element(screen.getByText('Delete "Core Words"?'))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("This action cannot be undone."))
      .toBeInTheDocument();
  });

  test("renders nothing when no board set is targeted", async () => {
    const screen = await render(
      <BoardSetDeleteDialog
        boardSet={null}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await expect
      .element(screen.getByText("This action cannot be undone."))
      .not.toBeInTheDocument();
  });

  test("calls onConfirm when Delete is clicked", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const screen = await render(
      <BoardSetDeleteDialog
        boardSet={makeBoardSet()}
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    await screen.getByRole("button", { name: "Delete" }).click();

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
  });

  test("calls onClose when Cancel is clicked", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const screen = await render(
      <BoardSetDeleteDialog
        boardSet={makeBoardSet()}
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    await screen.getByRole("button", { name: "Cancel" }).click();

    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
