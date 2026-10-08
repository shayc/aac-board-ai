import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { BoardSetDetailsDialog } from "./board-set-details-dialog";
import { makeBoardSet } from "./test-utils";

function renderWithProviders(children: ReactNode) {
  return render(<AppProviders>{children}</AppProviders>);
}

describe("BoardSetDetailsDialog", () => {
  test("shows the available metadata with no a11y violations", async () => {
    const screen = await renderWithProviders(
      <BoardSetDetailsDialog
        boardSet={makeBoardSet({
          name: "Core Words",
          author: "Jane",
          gridRows: 2,
          gridColumns: 3,
          license: "CC BY-SA 4.0",
          description: "A starter vocabulary board.",
        })}
        onClose={vi.fn()}
      />,
    );

    await expect
      .element(screen.getByRole("dialog", { name: "Core Words By Jane" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("heading", { name: "Core Words By Jane" }))
      .toBeInTheDocument();
    await expect.element(screen.getByText("By Jane")).toBeInTheDocument();
    await expect
      .element(screen.getByText(/grid$/))
      .toHaveTextContent("2×3 grid");
    await expect.element(screen.getByText("CC BY-SA 4.0")).toBeInTheDocument();
    await expect
      .element(screen.getByText("A starter vocabulary board."))
      .toBeInTheDocument();

    await expectNoA11yViolations(document.body);
  });

  test("omits the author line and chips when those fields are absent", async () => {
    const screen = await renderWithProviders(
      <BoardSetDetailsDialog boardSet={makeBoardSet()} onClose={vi.fn()} />,
    );

    await expect.element(screen.getByText("My Board")).toBeInTheDocument();
    await expect.element(screen.getByText(/^By /)).not.toBeInTheDocument();
    await expect.element(screen.getByText(/grid$/)).not.toBeInTheDocument();
    await expect
      .element(screen.getByText("CC BY-SA 4.0"))
      .not.toBeInTheDocument();
  });

  test("renders nothing when no board set is targeted", async () => {
    const screen = await renderWithProviders(
      <BoardSetDetailsDialog boardSet={null} onClose={vi.fn()} />,
    );

    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
  });

  test("calls onClose when Close is clicked", async () => {
    const onClose = vi.fn();
    const screen = await renderWithProviders(
      <BoardSetDetailsDialog boardSet={makeBoardSet()} onClose={onClose} />,
    );

    await screen.getByRole("button", { name: "Close" }).click();

    expect(onClose).toHaveBeenCalledOnce();
  });
});
