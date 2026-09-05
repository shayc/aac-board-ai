import { AppProviders } from "@shared/providers/app-providers";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { BoardSetList } from "./board-set-list";
import { makeBoardSet } from "./test-utils";

function renderWithProviders(children: ReactNode) {
  return render(<AppProviders>{children}</AppProviders>);
}

describe("BoardSetList", () => {
  test("renders an item per board set with its name", async () => {
    const screen = await renderWithProviders(
      <BoardSetList
        boardSets={[
          makeBoardSet({ setId: "a", name: "Core Words" }),
          makeBoardSet({ setId: "b", name: "Animals" }),
        ]}
        onSelect={vi.fn()}
        onShowDetails={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await expect.element(screen.getByText("Core Words")).toBeInTheDocument();
    await expect.element(screen.getByText("Animals")).toBeInTheDocument();
  });

  test("calls onSelect with the board set when its row is clicked", async () => {
    const onSelect = vi.fn();
    const screen = await renderWithProviders(
      <BoardSetList
        boardSets={[makeBoardSet({ name: "Core Words" })]}
        onSelect={onSelect}
        onShowDetails={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await screen
      .getByRole("button", { name: "Core Words", exact: true })
      .click();

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect.mock.calls[0][0]).toMatchObject({ name: "Core Words" });
  });

  test("keeps labels, menus, and details actions associated with their list", async () => {
    const boardSets = [
      makeBoardSet({ setId: "core", name: "Core Words" }),
      makeBoardSet({ setId: "animals", name: "Animals" }),
    ];
    const onShowDetails = vi.fn();
    const onDelete = vi.fn();
    const screen = await renderWithProviders(
      <>
        {boardSets.map((boardSet) => (
          <BoardSetList
            key={boardSet.setId}
            boardSets={[boardSet]}
            onSelect={vi.fn()}
            onShowDetails={onShowDetails}
            onDelete={onDelete}
          />
        ))}
      </>,
    );

    const navigations = screen
      .getByRole("navigation", { name: "Board sets" })
      .all();
    expect(navigations).toHaveLength(2);

    const labelIds = navigations.map((navigation) => {
      const element = navigation.element();
      const labelId = element.getAttribute("aria-labelledby") ?? "";
      expect(element.contains(document.getElementById(labelId))).toBe(true);

      return labelId;
    });
    expect(new Set(labelIds).size).toBe(2);

    const menuIds: string[] = [];
    for (const [index, boardSet] of boardSets.entries()) {
      const trigger = screen.getByRole("button", {
        name: `More options for ${boardSet.name}`,
      });
      const button = trigger.element();
      await trigger.click();

      const menuId = button.getAttribute("aria-controls") ?? "";
      expect(
        document
          .getElementById(menuId)
          ?.contains(screen.getByRole("menu").element()),
      ).toBe(true);
      menuIds.push(menuId);

      await screen.getByRole("menuitem", { name: "Info" }).click();
      expect(onShowDetails).toHaveBeenNthCalledWith(index + 1, boardSet);
    }

    expect(new Set(menuIds).size).toBe(2);
    expect(onShowDetails).toHaveBeenCalledTimes(2);
    expect(onDelete).not.toHaveBeenCalled();
  });

  test("routes the menu's Delete to onDelete", async () => {
    const onShowDetails = vi.fn();
    const onDelete = vi.fn();
    const screen = await renderWithProviders(
      <BoardSetList
        boardSets={[makeBoardSet({ name: "Core Words" })]}
        onSelect={vi.fn()}
        onShowDetails={onShowDetails}
        onDelete={onDelete}
      />,
    );

    await screen
      .getByRole("button", { name: "More options for Core Words" })
      .click();
    await screen.getByRole("menuitem", { name: "Delete" }).click();

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete.mock.calls[0][0]).toMatchObject({ name: "Core Words" });
    expect(onShowDetails).not.toHaveBeenCalled();
  });
});
