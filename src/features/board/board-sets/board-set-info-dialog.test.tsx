import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { BoardSetInfoDialog } from "./board-set-info-dialog";
import { makeBoardSetRecord } from "../testing";

function renderWithProviders(children: ReactNode) {
  return render(<AppProviders>{children}</AppProviders>);
}

describe("BoardSetInfoDialog", () => {
  test("shows the available metadata with no accessibility violations", async () => {
    const screen = await renderWithProviders(
      <BoardSetInfoDialog
        boardSet={makeBoardSetRecord({
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
      .element(screen.getByRole("dialog", { name: "Core Words", exact: true }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("heading", { name: "Core Words", exact: true }))
      .toBeInTheDocument();
    await expect.element(screen.getByText("By Jane")).toBeVisible();
    await expect
      .element(screen.getByText(/grid$/))
      .toHaveTextContent("2×3 grid");
    await expect.element(screen.getByText("CC BY-SA 4.0")).toBeInTheDocument();
    await expect
      .element(screen.getByText("A starter vocabulary board."))
      .toBeInTheDocument();

    await expectNoA11yViolations(document.body);
  });

  test("scrolls a long description with the keyboard", async () => {
    const screen = await renderWithProviders(
      <BoardSetInfoDialog
        boardSet={makeBoardSetRecord({
          description: "A line of the description.\n".repeat(200),
        })}
        onClose={vi.fn()}
      />,
    );
    const details = screen.getByRole("region", { name: "Info" });
    await expect.element(details).toBeVisible();

    await userEvent.tab();
    await expect.element(details).toHaveFocus();

    await userEvent.keyboard("{End}");

    await expect.poll(() => details.element().scrollTop).toBeGreaterThan(0);
    await expectNoA11yViolations(document.body);
  });

  test("lets the description be selected for copying", async () => {
    const screen = await renderWithProviders(
      <BoardSetInfoDialog
        boardSet={makeBoardSetRecord({
          description: "Symbols from https://example.org/symbols",
        })}
        onClose={vi.fn()}
      />,
    );

    const description = screen.getByText(/example\.org/);
    await expect.element(description).toBeVisible();

    expect(getComputedStyle(description.element()).userSelect).toBe("text");
  });

  test.each([
    { width: 390, isFullScreen: true },
    { width: 1024, isFullScreen: false },
  ])(
    "fills the viewport only on small screens (width $width)",
    async ({ width, isFullScreen }) => {
      const originalWidth = window.innerWidth;
      const originalHeight = window.innerHeight;

      try {
        await page.viewport(width, 800);
        const screen = await renderWithProviders(
          <BoardSetInfoDialog
            boardSet={makeBoardSetRecord()}
            onClose={vi.fn()}
          />,
        );
        const dialog = screen.getByRole("dialog");

        await expect.element(dialog).toBeVisible();

        const bounds = dialog.element().getBoundingClientRect();
        const fillsViewport =
          bounds.width === window.innerWidth &&
          bounds.height === window.innerHeight;
        expect(fillsViewport).toBe(isFullScreen);
      } finally {
        await page.viewport(originalWidth, originalHeight);
      }
    },
  );

  test("omits the author line and chips when those fields are absent", async () => {
    const screen = await renderWithProviders(
      <BoardSetInfoDialog boardSet={makeBoardSetRecord()} onClose={vi.fn()} />,
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
      <BoardSetInfoDialog boardSet={null} onClose={vi.fn()} />,
    );

    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
  });

  test("calls onClose when Close is clicked", async () => {
    const onClose = vi.fn();
    const screen = await renderWithProviders(
      <BoardSetInfoDialog boardSet={makeBoardSetRecord()} onClose={onClose} />,
    );

    await screen.getByRole("button", { name: "Close" }).click();

    expect(onClose).toHaveBeenCalledOnce();
  });
});
