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
import { useState } from "react";
import type { BoardSetRecord } from "../storage/boards-db";

export interface BoardSetListProps {
  boardSets: BoardSetRecord[];
  onSelect: (boardSet: BoardSetRecord) => void;
  onDelete: (boardSet: BoardSetRecord) => void;
  onInfo: (boardSet: BoardSetRecord) => void;
}

export function BoardSetList({
  boardSets,
  onSelect,
  onDelete,
  onInfo,
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
      <List>
        {boardSets.map((boardSet) => (
          <ListItem
            key={boardSet.setId}
            disablePadding
            secondaryAction={
              <Tooltip title="More options">
                <IconButton
                  edge="end"
                  aria-label={`More options for ${boardSet.name}`}
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
                secondary={formatSecondary(boardSet)}
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
          <ListItemText>Info</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

function formatSecondary(boardSet: BoardSetRecord): string {
  const parts: string[] = [];

  const { gridRows, gridColumns, author } = boardSet;

  if (gridRows && gridColumns) {
    parts.push(`${gridRows}×${gridColumns}`);
  }

  if (author) {
    parts.push(`By ${author}`);
  }

  return parts.join(" · ");
}
