import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListSubheader from "@mui/material/ListSubheader";
import { m } from "@paraglide/messages.js";
import { useUILocale } from "@shared/language/language-store";
import { useTranslate } from "@shared/language/use-translate";
import { useId, useState } from "react";
import { rootBoardPath } from "../board-paths";
import { boardSetCatalog } from "../catalog/board-set-catalog";
import type { BoardSetRecord } from "../storage/board-set-storage";
import { BoardSetListItem } from "./board-set-list-item";
import { BoardSetMenu } from "./board-set-menu";

interface BoardSetEntry {
  id: string;
  name: string;
  storedBoardSet: BoardSetRecord | undefined;
  downloadURL: string | undefined;
}

interface BoardSetListProps {
  boardSets: readonly BoardSetRecord[];
  activeBoardSetId?: string;
  onShowInfo: (boardSet: BoardSetRecord) => void;
  onExport: (boardSet: BoardSetRecord) => void;
  onRequestDelete: (boardSet: BoardSetRecord) => void;
}

export function BoardSetList({
  boardSets,
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

  const entries = toSortedEntries(boardSets, uiLocale);
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

  function renderEntry({
    id,
    name,
    storedBoardSet,
    downloadURL,
  }: BoardSetEntry) {
    return (
      <BoardSetListItem
        key={id}
        menuId={menuId}
        name={name}
        to={storedBoardSet && rootBoardPath(storedBoardSet)}
        downloadURL={downloadURL}
        isActive={id === activeBoardSetId}
        isMenuOpen={id === openMenuBoardSetId}
        onMenuOpen={(element) => {
          if (storedBoardSet) {
            setMenuAnchor({ element, boardSet: storedBoardSet });
          }
        }}
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

// Catalog sets keep one entry whether or not they are stored, so a finished
// download changes its row in place instead of replacing it.
function toSortedEntries(
  boardSets: readonly BoardSetRecord[],
  locale: string,
): BoardSetEntry[] {
  const collator = new Intl.Collator(locale, { numeric: true });
  const storedBoardSetsById = new Map(
    boardSets.map((boardSet) => [boardSet.id, boardSet]),
  );
  const catalogIds = new Set(boardSetCatalog.map(({ id }) => id));
  const entries: BoardSetEntry[] = [
    ...boardSetCatalog.map(({ id, name, url }) => {
      const storedBoardSet = storedBoardSetsById.get(id);

      return {
        id,
        name: storedBoardSet?.name ?? name,
        storedBoardSet,
        downloadURL: url,
      };
    }),
    ...boardSets
      .filter(({ id }) => !catalogIds.has(id))
      .map((storedBoardSet) => ({
        id: storedBoardSet.id,
        name: storedBoardSet.name,
        storedBoardSet,
        downloadURL: undefined,
      })),
  ];

  return entries.toSorted(
    (a, b) => collator.compare(a.name, b.name) || collator.compare(a.id, b.id),
  );
}
