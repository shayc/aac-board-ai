import type { BoardSetRecord } from "@features/board/db/boards-db";
import DeleteIcon from "@mui/icons-material/Delete";
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
import { useState } from "react";

export interface BoardSetListProps {
  boardSets: BoardSetRecord[];
  onNavigate: (setId: string, rootBoardId?: string) => void;
  onDelete: (setId: string, name: string) => void;
}

export function BoardSetList({
  boardSets,
  onNavigate,
  onDelete,
}: BoardSetListProps) {
  const [menuAnchor, setMenuAnchor] = useState<{
    element: HTMLElement;
    setId: string;
    name: string;
  } | null>(null);

  const menuOpen = Boolean(menuAnchor);

  function handleMenuOpen(
    event: React.MouseEvent<HTMLElement>,
    set: BoardSetRecord,
  ) {
    setMenuAnchor({
      element: event.currentTarget,
      setId: set.setId,
      name: set.name,
    });
  }

  function handleMenuClose() {
    setMenuAnchor(null);
  }

  function handleDelete() {
    if (menuAnchor) {
      onDelete(menuAnchor.setId, menuAnchor.name);
    }

    handleMenuClose();
  }

  return (
    <>
      <List>
        {boardSets.map((set) => (
          <ListItem
            key={set.setId}
            disablePadding
            secondaryAction={
              <Tooltip title="More options">
                <IconButton
                  edge="end"
                  aria-label={`More options for ${set.name}`}
                  aria-controls={menuOpen ? "board-set-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={menuOpen ? "true" : undefined}
                  onClick={(event) => handleMenuOpen(event, set)}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            }
          >
            <ListItemButton
              onClick={() => onNavigate(set.setId, set.rootBoardId)}
            >
              <ListItemText
                primary={set.name}
                secondary={formatSecondary(set)}
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
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

function formatSecondary(set: BoardSetRecord): string {
  const parts: string[] = [];

  const { gridRows, gridColumns, author } = set;

  if (gridRows && gridColumns) {
    parts.push(`${gridRows}x${gridColumns}`);
  }

  if (author) {
    parts.push(`By ${author}`);
  }

  return parts.join(" · ");
}
