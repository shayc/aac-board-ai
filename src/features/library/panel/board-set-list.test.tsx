import { renderWithProviders } from "@shared/testing/render-with-providers";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, test, vi } from "vitest";
import { makeBoardSetRecord } from "../testing";
import { BoardSetList } from "./board-set-list";

function renderInRouter(children: ReactNode) {
  return renderWithProviders(<MemoryRouter>{children}</MemoryRouter>);
}

describe("BoardSetList", () => {
  test("renders board links and identifies the active set", async () => {
    const screen = await renderInRouter(
      <BoardSetList
        boardSets={[
          makeBoardSetRecord({
            id: "a",
            name: "Core Words",
            rootBoardId: "home",
          }),
          makeBoardSetRecord({ id: "b", name: "Animals" }),
        ]}
        downloadableBoardSets={[]}
        activeBoardSetId="a"
        onShowInfo={vi.fn()}
        onExport={vi.fn()}
        onRequestDelete={vi.fn()}
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

  test("keeps labels, menus, and info actions associated with their list", async () => {
    const boardSets = [
      makeBoardSetRecord({ id: "core", name: "Core Words" }),
      makeBoardSetRecord({ id: "animals", name: "Animals" }),
    ];
    const onShowInfo = vi.fn();
    const onRequestDelete = vi.fn();
    const screen = await renderInRouter(
      <>
        {boardSets.map((boardSet) => (
          <BoardSetList
            key={boardSet.id}
            boardSets={[boardSet]}
            downloadableBoardSets={[]}
            onShowInfo={onShowInfo}
            onExport={vi.fn()}
            onRequestDelete={onRequestDelete}
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
      expect(onShowInfo).toHaveBeenNthCalledWith(index + 1, boardSet);
    }

    expect(new Set(menuIds).size).toBe(2);
    expect(onShowInfo).toHaveBeenCalledTimes(2);
    expect(onRequestDelete).not.toHaveBeenCalled();
  });

  test("routes the menu's Delete to onRequestDelete", async () => {
    const onShowInfo = vi.fn();
    const onRequestDelete = vi.fn();
    const screen = await renderInRouter(
      <BoardSetList
        boardSets={[makeBoardSetRecord({ name: "Core Words" })]}
        downloadableBoardSets={[]}
        onShowInfo={onShowInfo}
        onExport={vi.fn()}
        onRequestDelete={onRequestDelete}
      />,
    );

    await screen
      .getByRole("button", { name: "More options for Core Words" })
      .click();
    await screen.getByRole("menuitem", { name: "Delete" }).click();

    expect(onRequestDelete).toHaveBeenCalledOnce();
    expect(onRequestDelete.mock.calls[0]?.[0]).toMatchObject({
      name: "Core Words",
    });
    expect(onShowInfo).not.toHaveBeenCalled();
  });

  test("routes the menu's Export to onExport", async () => {
    const onExport = vi.fn();
    const screen = await renderInRouter(
      <BoardSetList
        boardSets={[makeBoardSetRecord({ name: "Core Words" })]}
        downloadableBoardSets={[]}
        onShowInfo={vi.fn()}
        onExport={onExport}
        onRequestDelete={vi.fn()}
      />,
    );

    await screen
      .getByRole("button", { name: "More options for Core Words" })
      .click();
    await screen.getByRole("menuitem", { name: "Export" }).click();

    expect(onExport).toHaveBeenCalledOnce();
    expect(onExport.mock.calls[0]?.[0]).toMatchObject({ name: "Core Words" });
    await expect.element(screen.getByRole("menu")).not.toBeInTheDocument();
  });
});
