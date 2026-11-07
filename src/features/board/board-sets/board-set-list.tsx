import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import { listItemSecondaryActionClasses } from "@mui/material/ListItemSecondaryAction";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { useUILocale } from "@shared/language/language-store";
import { useTranslate } from "@shared/language/use-translate";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { Link } from "react-router";
import { rootBoardPath } from "../navigation/board-paths";
import type { BoardSetRecord } from "../storage/board-set-storage";
import type { CatalogBoardSet } from "./board-set-catalog";
import { DownloadableBoardSetListItem } from "./downloadable-board-set-list-item";

type BoardSetEntry =
  | { kind: "stored"; boardSet: BoardSetRecord }
  | { kind: "downloadable"; boardSet: CatalogBoardSet };

interface BoardSetListProps {
  storedBoardSets: readonly BoardSetRecord[];
  downloadableBoardSets: readonly CatalogBoardSet[];
  onNavigate: () => void;
  onShowInfo: (boardSet: BoardSetRecord) => void;
  onRequestDelete: (boardSet: BoardSetRecord) => void;
  activeBoardSetId?: string;
}

export function BoardSetList({
  storedBoardSets,
  downloadableBoardSets,
  onNavigate,
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

  const entries = toSortedEntries(
    storedBoardSets,
    downloadableBoardSets,
    uiLocale,
  );

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

    if (kind === "downloadable") {
      return (
        <DownloadableBoardSetListItem
          key={boardSet.id}
          name={boardSet.name}
          url={boardSet.url}
          onDownloaded={setBoardSetIdToFocus}
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
        onNavigate={onNavigate}
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
  storedBoardSets: readonly BoardSetRecord[],
  downloadableBoardSets: readonly CatalogBoardSet[],
  locale: string,
): BoardSetEntry[] {
  const collator = new Intl.Collator(locale, { numeric: true });
  const entries: BoardSetEntry[] = [
    ...storedBoardSets.map((boardSet) => ({
      kind: "stored" as const,
      boardSet,
    })),
    ...downloadableBoardSets.map((boardSet) => ({
      kind: "downloadable" as const,
      boardSet,
    })),
  ];

  return entries.toSorted(
    (a, b) =>
      collator.compare(a.boardSet.name, b.boardSet.name) ||
      collator.compare(a.boardSet.id, b.boardSet.id),
  );
}

interface BoardSetListItemProps {
  menuId: string;
  name: string;
  to: string;
  isActive: boolean;
  isFocusRequested: boolean;
  isMenuOpen: boolean;
  onNavigate: () => void;
  onMenuOpen: (element: HTMLElement) => void;
}

function BoardSetListItem({
  menuId,
  name,
  to,
  isActive,
  isFocusRequested,
  isMenuOpen,
  onNavigate,
  onMenuOpen,
}: BoardSetListItemProps) {
  const t = useTranslate();
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (isFocusRequested) {
      linkRef.current?.focus();
    }
  }, [isFocusRequested]);

  function handleLinkClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    onNavigate();
  }

  return (
    <ListItem
      secondaryAction={
        <Tooltip title={t(m.libraryMoreOptions)} placement="right">
          <IconButton
            aria-label={t(m.libraryMoreOptionsFor, { name })}
            aria-controls={isMenuOpen ? menuId : undefined}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen ? "true" : undefined}
            edge="end"
            onClick={(event) => onMenuOpen(event.currentTarget)}
            sx={{ border: "none" }}
          >
            <MoreVertIcon />
          </IconButton>
        </Tooltip>
      }
      disablePadding
      sx={(theme) => ({
        "@media (hover: hover)": {
          [theme.breakpoints.up("md")]: {
            [`& .${listItemSecondaryActionClasses.root}`]: {
              opacity: 0,
              pointerEvents: "none",
              transition: theme.transitions.create("opacity", {
                duration: theme.transitions.duration.shortest,
              }),
              "@media (prefers-reduced-motion: reduce)": {
                transition: "none",
              },
            },
            [`&:is(:hover, :focus-within, :has([aria-expanded="true"])) .${listItemSecondaryActionClasses.root}`]:
              { opacity: 1, pointerEvents: "auto" },
          },
        },
      })}
    >
      <ListItemButton
        ref={linkRef}
        aria-current={isActive ? "true" : undefined}
        component={Link}
        to={to}
        selected={isActive}
        onClick={handleLinkClick}
      >
        <ListItemText
          primary={name}
          slotProps={{ primary: { noWrap: true } }}
        />
      </ListItemButton>
    </ListItem>
  );
}
