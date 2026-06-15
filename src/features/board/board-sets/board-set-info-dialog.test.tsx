import { AppProviders } from "@shared/providers/app-providers";
import type { ReactElement } from "react";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { BoardSetInfoDialog } from "./board-set-info-dialog";
import { makeBoardSet } from "./test-utils";

function renderDialog(ui: ReactElement) {
  return render(<AppProviders>{ui}</AppProviders>);
}

describe("BoardSetInfoDialog", () => {
  test("shows the name and author", async () => {
    const screen = await renderDialog(
      <BoardSetInfoDialog
        boardSet={makeBoardSet({ name: "Core Words", author: "Jane" })}
        onClose={vi.fn()}
      />,
    );

    await expect.element(screen.getByText("Core Words")).toBeInTheDocument();
    await expect.element(screen.getByText("By Jane")).toBeInTheDocument();
  });

  test("builds chips from grid dimensions, locale, and license", async () => {
    const screen = await renderDialog(
      <BoardSetInfoDialog
        boardSet={makeBoardSet({
          gridRows: 2,
          gridColumns: 3,
          locale: "en",
          license: "CC BY-SA 4.0",
        })}
        onClose={vi.fn()}
      />,
    );

    await expect.element(screen.getByText("2×3 Grid")).toBeInTheDocument();
    await expect.element(screen.getByText("English")).toBeInTheDocument();
    await expect.element(screen.getByText("CC BY-SA 4.0")).toBeInTheDocument();
  });

  test("omits the author line and chips when those fields are absent", async () => {
    const screen = await renderDialog(
      <BoardSetInfoDialog boardSet={makeBoardSet()} onClose={vi.fn()} />,
    );

    await expect.element(screen.getByText("My Board")).toBeInTheDocument();
    await expect.element(screen.getByText(/^By /)).not.toBeInTheDocument();
    await expect.element(screen.getByText(/Grid$/)).not.toBeInTheDocument();
  });

  test("shows the description when present", async () => {
    const screen = await renderDialog(
      <BoardSetInfoDialog
        boardSet={makeBoardSet({ description: "A starter vocabulary board." })}
        onClose={vi.fn()}
      />,
    );

    await expect
      .element(screen.getByText("A starter vocabulary board."))
      .toBeInTheDocument();
  });

  test("renders nothing when no board set is targeted", async () => {
    const screen = await renderDialog(
      <BoardSetInfoDialog boardSet={null} onClose={vi.fn()} />,
    );

    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
  });

  test("calls onClose when Close is clicked", async () => {
    const onClose = vi.fn();
    const screen = await renderDialog(
      <BoardSetInfoDialog boardSet={makeBoardSet()} onClose={onClose} />,
    );

    await screen.getByRole("button", { name: "Close" }).click();

    expect(onClose).toHaveBeenCalledOnce();
  });
});
