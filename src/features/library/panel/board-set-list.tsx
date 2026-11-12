import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListSubheader from "@mui/material/ListSubheader";
import { m } from "@paraglide/messages.js";
import { useUILocale } from "@shared/language/language-store";
import { useTranslate } from "@shared/language/use-translate";
import { useEffect, useId, useState } from "react";
import { rootBoardPath } from "../board-paths";
import type { CatalogBoardSet } from "../catalog/board-set-catalog";
import { subscribeCompletedDownloads } from "../catalog/board-set-downloads";
import type { BoardSetRecord } from "../storage/board-set-storage";
import { BoardSetListItem } from "./board-set-list-item";
import { BoardSetMenu } from "./board-set-menu";
import { DownloadableBoardSetListItem } from "./downloadable-board-set-list-item";

type BoardSetEntry =
  | { kind: "open"; boardSet: BoardSetRecord }
  | { kind: "download"; boardSet: CatalogBoardSet };

interface BoardSetListProps {
  boardSets: readonly BoardSetRecord[];
  downloadableBoardSets: readonly CatalogBoardSet[];
  activeBoardSetId?: string;
  onShowInfo: (boardSet: BoardSetRecord) => void;
  onExport: (boardSet: BoardSetRecord) => void;
  onRequestDelete: (boardSet: BoardSetRecord) => void;
}

export function BoardSetList({
  boardSets,
  downloadableBoardSets,
  activeBoardSetId,
  onShowInfo,
  onExport,
  onRequestDelete,
}: BoardSetListProps) {
  const t = useTranslate();
  const uiLocale = useUILocale();
  const menuId = useId();
  const subheaderId = useId();
  const [menuAnchor, setMenuAnchor] = useState<{
    element: HTMLElement;
    boardSet: BoardSetRecord;
  } | null>(null);
  const [boardSetIdToFocus, setBoardSetIdToFocus] = useState<string>();

  useEffect(() => subscribeCompletedDownloads(setBoardSetIdToFocus), []);

  const entries = toSortedEntries(boardSets, downloadableBoardSets, uiLocale);

  const openMenuBoardSetId = menuAnchor?.boardSet.id;

  function handleMenuClose() {
    setMenuAnchor(null);
  }

  function selectFromMenu(onSelect: (boardSet: BoardSetRecord) => void) {
    if (menuAnchor) {
      onSelect(menuAnchor.boardSet);
    }

    handleMenuClose();
  }

  function renderEntry(entry: BoardSetEntry) {
    const { kind, boardSet } = entry;

    if (kind === "download") {
      return (
        <DownloadableBoardSetListItem
          key={boardSet.id}
          name={boardSet.name}
          url={boardSet.url}
        />
      );
    }

    return (
      <BoardSetListItem
        key={boardSet.id}
        menuId={menuId}
        name={boardSet.name}
        to={rootBoardPath(boardSet)}
        isActive={boardSet.id === activeBoardSetId}
        isFocusRequested={boardSet.id === boardSetIdToFocus}
        isMenuOpen={boardSet.id === openMenuBoardSetId}
        onMenuOpen={(element) => setMenuAnchor({ element, boardSet })}
      />
    );
  }

  return (
    <>
      <Box aria-labelledby={subheaderId} component="nav">
        <List
          subheader={
            <ListSubheader
              id={subheaderId}
              sx={{ bgcolor: "background.default" }}
            >
              {t(m.libraryBoardSets)}
            </ListSubheader>
          }
          sx={{ px: 1 }}
        >
          {entries.map(renderEntry)}
        </List>
      </Box>

      <BoardSetMenu
        id={menuId}
        anchorElement={menuAnchor?.element}
        onClose={handleMenuClose}
        onShowInfo={() => selectFromMenu(onShowInfo)}
        onExport={() => selectFromMenu(onExport)}
        onRequestDelete={() => selectFromMenu(onRequestDelete)}
      />
    </>
  );
}

function toSortedEntries(
  boardSets: readonly BoardSetRecord[],
  downloadableBoardSets: readonly CatalogBoardSet[],
  locale: string,
): BoardSetEntry[] {
  const collator = new Intl.Collator(locale, { numeric: true });
  const entries: BoardSetEntry[] = [
    ...boardSets.map((boardSet) => ({
      kind: "open" as const,
      boardSet,
    })),
    ...downloadableBoardSets.map((boardSet) => ({
      kind: "download" as const,
      boardSet,
    })),
  ];

  return entries.toSorted(
    (a, b) =>
      collator.compare(a.boardSet.name, b.boardSet.name) ||
      collator.compare(a.boardSet.id, b.boardSet.id),
  );
}
