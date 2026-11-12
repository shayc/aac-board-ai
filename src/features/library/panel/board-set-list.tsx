import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SaveAltOutlinedIcon from "@mui/icons-material/SaveAltOutlined";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem, { listItemClasses } from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { useUILocale } from "@shared/language/language-store";
import { useTranslate } from "@shared/language/use-translate";
import { useEndSide } from "@shared/theme/rtl";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router";
import { rootBoardPath } from "../board-paths";
import type { CatalogBoardSet } from "../catalog/board-set-catalog";
import { subscribeCompletedDownloads } from "../catalog/board-set-downloads";
import type { BoardSetRecord } from "../storage/board-set-storage";
import { DownloadableBoardSetListItem } from "./downloadable-board-set-list-item";

type BoardSetEntry =
  | { kind: "open"; boardSet: BoardSetRecord }
  | { kind: "download"; boardSet: CatalogBoardSet };

interface BoardSetListProps {
  boardSets: readonly BoardSetRecord[];
  downloadableBoardSets: readonly CatalogBoardSet[];
  onShowInfo: (boardSet: BoardSetRecord) => void;
  onExport: (boardSet: BoardSetRecord) => void;
  onRequestDelete: (boardSet: BoardSetRecord) => void;
  activeBoardSetId?: string;
}

export function BoardSetList({
  boardSets,
  downloadableBoardSets,
  onShowInfo,
  onExport,
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

  function handleExport() {
    if (menuAnchor) {
      onExport(menuAnchor.boardSet);
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
        <MenuItem onClick={handleExport}>
          <ListItemIcon>
            <SaveAltOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t(m.libraryExport)}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleRequestDelete} sx={{ color: "error.main" }}>
          <ListItemIcon sx={{ color: "inherit" }}>
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

interface BoardSetListItemProps {
  menuId: string;
  name: string;
  to: string;
  isActive: boolean;
  isFocusRequested: boolean;
  isMenuOpen: boolean;
  onMenuOpen: (element: HTMLElement) => void;
}

function BoardSetListItem({
  menuId,
  name,
  to,
  isActive,
  isFocusRequested,
  isMenuOpen,
  onMenuOpen,
}: BoardSetListItemProps) {
  const t = useTranslate();
  const endSide = useEndSide();
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (isFocusRequested) {
      linkRef.current?.focus();
    }
  }, [isFocusRequested]);

  return (
    <ListItem
      secondaryAction={
        <Tooltip title={t(m.libraryMoreOptions)} placement={endSide}>
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
            [`& .${listItemClasses.secondaryAction}`]: {
              opacity: 0,
              pointerEvents: "none",
              transition: theme.transitions.create("opacity", {
                duration: theme.transitions.duration.shortest,
              }),
              "@media (prefers-reduced-motion: reduce)": {
                transition: "none",
              },
            },
            [`&:is(:hover, :focus-within, :has([aria-expanded="true"])) .${listItemClasses.secondaryAction}`]:
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
      >
        <ListItemText
          primary={name}
          slotProps={{ primary: { noWrap: true } }}
        />
      </ListItemButton>
    </ListItem>
  );
}
