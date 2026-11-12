import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { BoardSetDeleteDialog } from "./board-set-delete-dialog";
import { makeBoardSetRecord } from "../testing";

function renderWithProviders(children: ReactNode) {
  return render(<AppProviders>{children}</AppProviders>);
}

describe("BoardSetDeleteDialog", () => {
  test("names the board set in the warning with no accessibility violations", async () => {
    const screen = await renderWithProviders(
      <BoardSetDeleteDialog
        boardSet={makeBoardSetRecord({ name: "Core Words" })}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const dialog = screen.getByRole("dialog", {
      name: "Delete board set?",
    });

    await expect.element(dialog).toBeVisible();
    await expect
      .element(dialog)
      .toHaveAccessibleDescription(
        '"Core Words" will be deleted. This cannot be undone.',
      );

    await expectNoA11yViolations(document.body);
  });

  test("renders nothing when no board set is targeted", async () => {
    const screen = await renderWithProviders(
      <BoardSetDeleteDialog
        boardSet={null}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
  });

  test("calls onDelete when Delete is clicked", async () => {
    const onDelete = vi.fn();
    const onClose = vi.fn();
    const screen = await renderWithProviders(
      <BoardSetDeleteDialog
        boardSet={makeBoardSetRecord()}
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
        boardSet={makeBoardSetRecord()}
        onDelete={onDelete}
        onClose={onClose}
      />,
    );

    await screen.getByRole("button", { name: "Cancel" }).click();

    expect(onClose).toHaveBeenCalledOnce();
    expect(onDelete).not.toHaveBeenCalled();
  });
});
