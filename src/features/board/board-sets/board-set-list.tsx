import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { useId, useState, type MouseEvent } from "react";
import { Link } from "react-router";
import { rootBoardPath } from "../navigation/board-paths";
import type { BoardSetRecord } from "./board-sets-store";

interface BoardSetListProps {
  boardSets: BoardSetRecord[];
  onActivate?: () => void;
  onShowDetails: (boardSet: BoardSetRecord) => void;
  onDelete: (boardSet: BoardSetRecord) => void;
  activeSetId?: string;
}

export function BoardSetList({
  boardSets,
  onActivate,
  onShowDetails,
  onDelete,
  activeSetId,
}: BoardSetListProps) {
  const t = useTranslate();
  const menuId = useId();
  const subheaderId = useId();
  const [menuAnchor, setMenuAnchor] = useState<{
    element: HTMLElement;
    boardSet: BoardSetRecord;
  } | null>(null);

  const isMenuOpen = Boolean(menuAnchor);
  const activeMenuSetId = menuAnchor?.boardSet.id;

  function handleMenuOpen(element: HTMLElement, boardSet: BoardSetRecord) {
    setMenuAnchor({ element, boardSet });
  }

  function handleMenuClose() {
    setMenuAnchor(null);
  }

  function handleShowDetails() {
    if (menuAnchor) {
      onShowDetails(menuAnchor.boardSet);
    }

    handleMenuClose();
  }

  function handleDelete() {
    if (menuAnchor) {
      onDelete(menuAnchor.boardSet);
    }

    handleMenuClose();
  }

  return (
    <>
      <Box aria-labelledby={subheaderId} component="nav">
        <List
          subheader={
            <ListSubheader id={subheaderId}>{t(m.libraryBoards)}</ListSubheader>
          }
          sx={{ px: 1 }}
        >
          {boardSets.map((boardSet) => (
            <BoardSetListItem
              key={boardSet.id}
              menuId={menuId}
              name={boardSet.name}
              to={rootBoardPath(boardSet)}
              isActive={boardSet.id === activeSetId}
              isMenuOpen={boardSet.id === activeMenuSetId}
              onActivate={onActivate}
              onMenuOpen={(element) => handleMenuOpen(element, boardSet)}
            />
          ))}
        </List>
      </Box>

      <Menu
        id={menuId}
        open={isMenuOpen}
        onClose={handleMenuClose}
        anchorEl={menuAnchor?.element}
      >
        <MenuItem onClick={handleShowDetails}>
          <ListItemIcon>
            <InfoOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t(m.libraryDetails)}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t(m.libraryDelete)}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

interface BoardSetListItemProps {
  menuId: string;
  name: string;
  to: string;
  isActive: boolean;
  isMenuOpen: boolean;
  onActivate?: () => void;
  onMenuOpen: (element: HTMLElement) => void;
}

function BoardSetListItem({
  menuId,
  name,
  to,
  isActive,
  isMenuOpen,
  onActivate,
  onMenuOpen,
}: BoardSetListItemProps) {
  const t = useTranslate();

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

    onActivate?.();
  }

  return (
    <ListItem
      data-menu-open={isMenuOpen || undefined}
      secondaryAction={
        <Tooltip title={t(m.libraryMoreOptions)}>
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
            "& .MuiListItemSecondaryAction-root": {
              opacity: 0,
              pointerEvents: "none",
              transition: theme.transitions.create("opacity", {
                duration: theme.transitions.duration.shortest,
              }),
              "@media (prefers-reduced-motion: reduce)": {
                transition: "none",
              },
            },
            "&:is(:hover, :focus-within, [data-menu-open]) .MuiListItemSecondaryAction-root":
              { opacity: 1, pointerEvents: "auto" },
          },
        },
      })}
    >
      <ListItemButton
        aria-current={isActive ? "true" : undefined}
        component={Link}
        to={to}
        selected={isActive}
        onClick={handleLinkClick}
      >
        <ListItemText
          primary={
            <Box
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {name}
            </Box>
          }
        />
      </ListItemButton>
    </ListItem>
  );
}
