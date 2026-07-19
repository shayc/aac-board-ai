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
import { useState } from "react";
import type { BoardSetRecord } from "../storage/boards-db";

interface BoardSetListProps {
  boardSets: BoardSetRecord[];
  onSelect: (boardSet: BoardSetRecord) => void;
  onInfo: (boardSet: BoardSetRecord) => void;
  onDelete: (boardSet: BoardSetRecord) => void;
  selectedSetId?: string;
}

export function BoardSetList({
  boardSets,
  onSelect,
  onInfo,
  onDelete,
  selectedSetId,
}: BoardSetListProps) {
  const t = useTranslate();
  const [menuAnchor, setMenuAnchor] = useState<{
    element: HTMLElement;
    boardSet: BoardSetRecord;
  } | null>(null);

  const menuOpen = Boolean(menuAnchor);
  const activeMenuSetId = menuAnchor?.boardSet.setId;

  function handleMenuOpen(
    event: React.MouseEvent<HTMLElement>,
    boardSet: BoardSetRecord,
  ) {
    setMenuAnchor({ element: event.currentTarget, boardSet });
  }

  function handleMenuClose() {
    setMenuAnchor(null);
  }

  function handleInfo() {
    if (menuAnchor) {
      onInfo(menuAnchor.boardSet);
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
      <Box component="nav" aria-labelledby="board-set-list-subheader">
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
                },
                "& .MuiListItem-root:is(:hover, :focus-within, [data-menu-open]) .MuiListItemSecondaryAction-root":
                  { opacity: 1, pointerEvents: "auto" },
              },
            },
          })}
        >
          {boardSets.map((boardSet) => {
            const isMenuOpen = activeMenuSetId === boardSet.setId;

            return (
              <ListItem
                disablePadding
                key={boardSet.setId}
                data-menu-open={isMenuOpen || undefined}
                secondaryAction={
                  <Tooltip title={t(m.libraryMoreOptions)}>
                    <IconButton
                      edge="end"
                      aria-label={t(m.libraryMoreOptionsFor, {
                        name: boardSet.name,
                      })}
                      aria-controls={isMenuOpen ? "board-set-menu" : undefined}
                      aria-haspopup="menu"
                      aria-expanded={isMenuOpen ? "true" : undefined}
                      onClick={(event) => handleMenuOpen(event, boardSet)}
                      sx={{ border: "none" }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemButton
                  selected={boardSet.setId === selectedSetId}
                  onClick={() => onSelect(boardSet)}
                >
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {boardSet.name}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Menu
        id="board-set-menu"
        anchorEl={menuAnchor?.element}
        open={menuOpen}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleInfo}>
          <ListItemIcon>
            <InfoOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t(m.libraryInfo)}</ListItemText>
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
