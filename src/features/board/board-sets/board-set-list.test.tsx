import { AppProviders } from "@shared/providers/app-providers";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { BoardSetList } from "./board-set-list";
import { makeBoardSet } from "./test-utils";

function renderWithProviders(children: ReactNode) {
  return render(
    <MemoryRouter>
      <AppProviders>{children}</AppProviders>
    </MemoryRouter>,
  );
}

describe("BoardSetList", () => {
  test("renders board links and identifies the active set", async () => {
    const screen = await renderWithProviders(
      <BoardSetList
        boardSets={[
          makeBoardSet({ id: "a", name: "Core Words", rootBoardId: "home" }),
          makeBoardSet({ id: "b", name: "Animals" }),
        ]}
        activeSetId="a"
        onActivate={vi.fn()}
        onShowDetails={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const coreLink = screen.getByRole("link", { name: "Core Words" });
    const animalsLink = screen.getByRole("link", { name: "Animals" });

    await expect
      .element(coreLink)
      .toHaveAttribute("href", "/sets/a/boards/home");
    await expect.element(coreLink).toHaveAttribute("aria-current", "true");
    await expect
      .element(animalsLink)
      .toHaveAttribute("href", "/sets/b/boards/root");
    await expect.element(animalsLink).not.toHaveAttribute("aria-current");
  });

  test("notifies the parent when a board link is activated", async () => {
    const onActivate = vi.fn();
    const screen = await renderWithProviders(
      <BoardSetList
        boardSets={[makeBoardSet({ name: "Core Words" })]}
        onActivate={onActivate}
        onShowDetails={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await screen.getByRole("link", { name: "Core Words", exact: true }).click();

    expect(onActivate).toHaveBeenCalledOnce();
  });

  test("keeps labels, menus, and details actions associated with their list", async () => {
    const boardSets = [
      makeBoardSet({ id: "core", name: "Core Words" }),
      makeBoardSet({ id: "animals", name: "Animals" }),
    ];
    const onShowDetails = vi.fn();
    const onDelete = vi.fn();
    const screen = await renderWithProviders(
      <>
        {boardSets.map((boardSet) => (
          <BoardSetList
            key={boardSet.id}
            boardSets={[boardSet]}
            onActivate={vi.fn()}
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
        onActivate={vi.fn()}
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
