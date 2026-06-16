import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { useState } from "react";
import type { BoardSetRecord } from "../storage/boards-db";

export interface BoardSetListProps {
  boardSets: BoardSetRecord[];
  onSelect: (boardSet: BoardSetRecord) => void;
  onInfo: (boardSet: BoardSetRecord) => void;
  onDelete: (boardSet: BoardSetRecord) => void;
}

export function BoardSetList({
  boardSets,
  onSelect,
  onInfo,
  onDelete,
}: BoardSetListProps) {
  const [menuAnchor, setMenuAnchor] = useState<{
    element: HTMLElement;
    boardSet: BoardSetRecord;
  } | null>(null);

  const menuOpen = Boolean(menuAnchor);

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
      <List sx={{ p: 1 }}>
        {boardSets.map((boardSet) => (
          <ListItem
            disablePadding
            key={boardSet.setId}
            sx={(theme) => ({
              borderRadius: 6,
              overflow: "hidden",
              [`${theme.breakpoints.up("md")} and (hover: hover)`]: {
                "& .MuiListItem-secondaryAction": {
                  opacity:
                    menuAnchor?.boardSet.setId === boardSet.setId ? 1 : 0,
                  transition: theme.transitions.create("opacity", {
                    duration: theme.transitions.duration.shorter,
                  }),
                },
                "&:hover .MuiListItem-secondaryAction, &:focus-within .MuiListItem-secondaryAction":
                  {
                    opacity: 1,
                  },
              },
            })}
            secondaryAction={
              <Tooltip title={m.libraryMoreOptions()}>
                <IconButton
                  edge="end"
                  aria-label={m.libraryMoreOptionsFor({ name: boardSet.name })}
                  aria-controls={menuOpen ? "board-set-menu" : undefined}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen ? "true" : undefined}
                  onClick={(event) => handleMenuOpen(event, boardSet)}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            }
          >
            <ListItemButton onClick={() => onSelect(boardSet)}>
              <ListItemText
                primary={boardSet.name}
                sx={{
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

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
          <ListItemText>{m.libraryInfo()}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{m.libraryDelete()}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
