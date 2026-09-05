import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { BoardSetDeleteDialog } from "./board-set-delete-dialog";
import { makeBoardSet } from "./test-utils";

function renderWithProviders(children: ReactNode) {
  return render(<AppProviders>{children}</AppProviders>);
}

describe("BoardSetDeleteDialog", () => {
  test("has no a11y violations when open", async () => {
    const screen = await renderWithProviders(
      <BoardSetDeleteDialog
        boardSet={makeBoardSet({ name: "Core Words" })}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const dialog = screen.getByRole("dialog", {
      name: 'Delete board set "Core Words"?',
    });

    await expect.element(dialog).toBeVisible();
    await expect
      .element(dialog)
      .toHaveAccessibleDescription(
        "The board in this set will be deleted. This cannot be undone.",
      );
    await expectNoA11yViolations(document.body);
  });

  test("shows the board set name and the single-board warning", async () => {
    const screen = await renderWithProviders(
      <BoardSetDeleteDialog
        boardSet={makeBoardSet({ name: "Core Words", boardCount: 1 })}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await expect
      .element(screen.getByText('Delete board set "Core Words"?'))
      .toBeInTheDocument();
    await expect
      .element(
        screen.getByText(
          "The board in this set will be deleted. This cannot be undone.",
        ),
      )
      .toBeInTheDocument();
  });

  test("shows the board count in the multiple-board warning", async () => {
    const screen = await renderWithProviders(
      <BoardSetDeleteDialog
        boardSet={makeBoardSet({ boardCount: 5 })}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await expect
      .element(
        screen.getByText(
          "All 5 boards in this set will be deleted. This cannot be undone.",
        ),
      )
      .toBeInTheDocument();
  });

  test("renders nothing when no board set is targeted", async () => {
    const screen = await renderWithProviders(
      <BoardSetDeleteDialog
        boardSet={null}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await expect
      .element(
        screen.getByText(
          "The board in this set will be deleted. This cannot be undone.",
        ),
      )
      .not.toBeInTheDocument();
  });

  test("calls onDelete when Delete is clicked", async () => {
    const onDelete = vi.fn();
    const onClose = vi.fn();
    const screen = await renderWithProviders(
      <BoardSetDeleteDialog
        boardSet={makeBoardSet()}
        onDelete={onDelete}
        onClose={onClose}
      />,
    );

    await screen.getByRole("button", { name: "Delete" }).click();

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
  });

  test("calls onClose when Cancel is clicked", async () => {
    const onDelete = vi.fn();
    const onClose = vi.fn();
    const screen = await renderWithProviders(
      <BoardSetDeleteDialog
        boardSet={makeBoardSet()}
        onDelete={onDelete}
        onClose={onClose}
      />,
    );

    await screen.getByRole("button", { name: "Cancel" }).click();

    expect(onClose).toHaveBeenCalledOnce();
    expect(onDelete).not.toHaveBeenCalled();
  });
});
