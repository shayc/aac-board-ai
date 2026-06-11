import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { BoardSetList } from "./board-set-list";
import { makeBoardSet } from "./test-utils";

describe("BoardSetList", () => {
  test("renders an item per board set with its name and grid/author summary", async () => {
    const screen = await render(
      <BoardSetList
        boardSets={[
          makeBoardSet({
            setId: "a",
            name: "Core Words",
            gridRows: 2,
            gridColumns: 3,
            author: "Jane",
          }),
          makeBoardSet({ setId: "b", name: "Animals" }),
        ]}
        onSelect={vi.fn()}
        onInfo={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await expect.element(screen.getByText("Core Words")).toBeInTheDocument();
    await expect.element(screen.getByText("2×3 · By Jane")).toBeInTheDocument();
    await expect.element(screen.getByText("Animals")).toBeInTheDocument();
  });

  test("calls onSelect with the board set when its row is clicked", async () => {
    const onSelect = vi.fn();
    const screen = await render(
      <BoardSetList
        boardSets={[makeBoardSet({ name: "Core Words" })]}
        onSelect={onSelect}
        onInfo={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await screen
      .getByRole("button", { name: "Core Words", exact: true })
      .click();

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect.mock.calls[0][0]).toMatchObject({ name: "Core Words" });
  });

  test("opens the row menu and routes Info to onInfo", async () => {
    const onInfo = vi.fn();
    const onDelete = vi.fn();
    const screen = await render(
      <BoardSetList
        boardSets={[makeBoardSet({ name: "Core Words" })]}
        onSelect={vi.fn()}
        onInfo={onInfo}
        onDelete={onDelete}
      />,
    );

    await screen
      .getByRole("button", { name: "More options for Core Words" })
      .click();
    await screen.getByRole("menuitem", { name: "Info" }).click();

    expect(onInfo).toHaveBeenCalledOnce();
    expect(onInfo.mock.calls[0][0]).toMatchObject({ name: "Core Words" });
    expect(onDelete).not.toHaveBeenCalled();
  });

  test("routes the menu's Delete to onDelete", async () => {
    const onInfo = vi.fn();
    const onDelete = vi.fn();
    const screen = await render(
      <BoardSetList
        boardSets={[makeBoardSet({ name: "Core Words" })]}
        onSelect={vi.fn()}
        onInfo={onInfo}
        onDelete={onDelete}
      />,
    );

    await screen
      .getByRole("button", { name: "More options for Core Words" })
      .click();
    await screen.getByRole("menuitem", { name: "Delete" }).click();

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete.mock.calls[0][0]).toMatchObject({ name: "Core Words" });
    expect(onInfo).not.toHaveBeenCalled();
  });
});
