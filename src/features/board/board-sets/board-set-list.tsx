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
import { useState, type MouseEvent } from "react";
import type { BoardSetRecord } from "./board-sets-store";

interface BoardSetListProps {
  boardSets: BoardSetRecord[];
  onSelect: (boardSet: BoardSetRecord) => void;
  onShowDetails: (boardSet: BoardSetRecord) => void;
  onDelete: (boardSet: BoardSetRecord) => void;
  selectedSetId?: string;
}

export function BoardSetList({
  boardSets,
  onSelect,
  onShowDetails,
  onDelete,
  selectedSetId,
}: BoardSetListProps) {
  const t = useTranslate();
  const [menuAnchor, setMenuAnchor] = useState<{
    element: HTMLElement;
    boardSet: BoardSetRecord;
  } | null>(null);

  const isMenuOpen = Boolean(menuAnchor);
  const activeMenuSetId = menuAnchor?.boardSet.setId;

  function handleMenuOpen(
    event: MouseEvent<HTMLElement>,
    boardSet: BoardSetRecord,
  ) {
    setMenuAnchor({ element: event.currentTarget, boardSet });
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
      <Box aria-labelledby="board-set-list-subheader" component="nav">
        <List
          subheader={
            <ListSubheader id="board-set-list-subheader">
              {t(m.libraryBoards)}
            </ListSubheader>
          }
          sx={(theme) => ({
            px: 1,
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
                "& .MuiListItem-root:is(:hover, :focus-within, [data-menu-open]) .MuiListItemSecondaryAction-root":
                  { opacity: 1, pointerEvents: "auto" },
              },
            },
          })}
        >
          {boardSets.map((boardSet) => (
            <BoardSetListItem
              key={boardSet.setId}
              name={boardSet.name}
              isSelected={boardSet.setId === selectedSetId}
              isMenuOpen={boardSet.setId === activeMenuSetId}
              onSelect={() => onSelect(boardSet)}
              onMenuOpen={(event) => handleMenuOpen(event, boardSet)}
            />
          ))}
        </List>
      </Box>

      <Menu
        id="board-set-menu"
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
  name: string;
  isSelected: boolean;
  isMenuOpen: boolean;
  onSelect: () => void;
  onMenuOpen: (event: MouseEvent<HTMLElement>) => void;
}

function BoardSetListItem({
  name,
  isSelected,
  isMenuOpen,
  onSelect,
  onMenuOpen,
}: BoardSetListItemProps) {
  const t = useTranslate();

  return (
    <ListItem
      data-menu-open={isMenuOpen || undefined}
      secondaryAction={
        <Tooltip title={t(m.libraryMoreOptions)}>
          <IconButton
            aria-label={t(m.libraryMoreOptionsFor, { name })}
            aria-controls={isMenuOpen ? "board-set-menu" : undefined}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen ? "true" : undefined}
            edge="end"
            onClick={onMenuOpen}
            sx={{ border: "none" }}
          >
            <MoreVertIcon />
          </IconButton>
        </Tooltip>
      }
      disablePadding
    >
      <ListItemButton selected={isSelected} onClick={onSelect}>
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
