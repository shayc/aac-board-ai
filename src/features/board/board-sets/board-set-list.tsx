import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { m } from "@paraglide/messages.js";
import { useUILocale } from "@shared/language/language-store";
import { useTranslate } from "@shared/language/use-translate";
import { useEffect, useId, useState } from "react";
import { rootBoardPath } from "../navigation/board-paths";
import type { BoardSetRecord } from "../storage/board-set-storage";
import type { CatalogBoardSet } from "./board-set-catalog";
import { subscribeCompletedDownloads } from "./board-set-downloads";
import { BoardSetListItem } from "./board-set-list-item";
import { DownloadableBoardSetListItem } from "./downloadable-board-set-list-item";

type BoardSetEntry =
  | { kind: "open"; boardSet: BoardSetRecord }
  | { kind: "download"; boardSet: CatalogBoardSet };

interface BoardSetListProps {
  boardSets: readonly BoardSetRecord[];
  downloadableBoardSets: readonly CatalogBoardSet[];
  onShowInfo: (boardSet: BoardSetRecord) => void;
  onRequestDelete: (boardSet: BoardSetRecord) => void;
  activeBoardSetId?: string;
}

export function BoardSetList({
  boardSets,
  downloadableBoardSets,
  onShowInfo,
  onRequestDelete,
  activeBoardSetId,
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

  const isMenuOpen = Boolean(menuAnchor);
  const openMenuBoardSetId = menuAnchor?.boardSet.id;

  function handleMenuOpen(element: HTMLElement, boardSet: BoardSetRecord) {
    setMenuAnchor({ element, boardSet });
  }

  function handleMenuClose() {
    setMenuAnchor(null);
  }

  function handleShowInfo() {
    if (menuAnchor) {
      onShowInfo(menuAnchor.boardSet);
    }

    handleMenuClose();
  }

  function handleRequestDelete() {
    if (menuAnchor) {
      onRequestDelete(menuAnchor.boardSet);
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
        onMenuOpen={(element) => handleMenuOpen(element, boardSet)}
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

      <Menu
        id={menuId}
        open={isMenuOpen}
        onClose={handleMenuClose}
        anchorEl={menuAnchor?.element}
      >
        <MenuItem onClick={handleShowInfo}>
          <ListItemIcon>
            <InfoOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t(m.libraryInfo)}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleRequestDelete}>
          <ListItemIcon>
            <DeleteOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t(m.libraryDelete)}</ListItemText>
        </MenuItem>
      </Menu>
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
