import { expectNoA11yViolations } from "@shared/testing/axe";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import { setTestViewport } from "@shared/testing/viewport";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { makeBoardSetRecord } from "../testing";
import { BoardSetInfoDialog } from "./board-set-info-dialog";

describe("BoardSetInfoDialog", () => {
  test("has no accessibility violations", async () => {
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
    await expect.element(screen.getByRole("dialog")).toBeVisible();

    await expectNoA11yViolations(document.body);
  });

  test("shows the available metadata", async () => {
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
  });

  test("keeps showing the board set while the dialog closes", async () => {
    // Fake timers hold the exit transition, so the closing dialog can be inspected.
    vi.useFakeTimers();
    onTestFinished(() => {
      vi.useRealTimers();
    });

    const screen = await renderWithProviders(
      <BoardSetInfoDialog
        boardSet={makeBoardSetRecord({
          name: "Core Words",
          description: "A starter vocabulary board.",
        })}
        onClose={vi.fn()}
      />,
    );
    await expect.element(screen.getByRole("dialog")).toBeVisible();

    await screen.rerender(
      <BoardSetInfoDialog boardSet={null} onClose={vi.fn()} />,
    );

    expect(screen.getByText("Core Words").query()).not.toBeNull();
    expect(
      screen.getByText("A starter vocabulary board.").query(),
    ).not.toBeNull();

    vi.runAllTimers();
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
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

    await userEvent.dblClick(description);

    const selectedText = getSelection()?.toString().trim() ?? "";
    expect(selectedText).not.toBe("");
    expect(description.element().textContent).toContain(selectedText);
  });

  test("stays sized to its content on small screens", async () => {
    await setTestViewport(390, 800);
    const screen = await renderWithProviders(
      <BoardSetInfoDialog boardSet={makeBoardSetRecord()} onClose={vi.fn()} />,
    );
    const dialog = screen.getByRole("dialog");

    await expect.element(dialog).toBeVisible();

    expect(dialog.element().getBoundingClientRect().height).toBeLessThan(
      window.innerHeight,
    );
  });

  test("omits the author line and facts when those fields are absent", async () => {
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
