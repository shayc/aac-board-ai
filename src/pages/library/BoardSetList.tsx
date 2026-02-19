import type { BoardSetRecord } from "@features/board/db/boards-db";
import DeleteIcon from "@mui/icons-material/Delete";
import GridViewIcon from "@mui/icons-material/GridView";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";

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
  return (
    <List>
      {boardSets.map((set) => (
        <ListItem
          key={set.setId}
          disablePadding
          secondaryAction={
            <Tooltip title="Delete">
              <IconButton
                edge="end"
                aria-label={`Delete ${set.name}`}
                onClick={() => onDelete(set.setId, set.name)}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          }
        >
          <ListItemButton
            onClick={() => onNavigate(set.setId, set.rootBoardId)}
          >
            <ListItemIcon>
              <GridViewIcon />
            </ListItemIcon>
            <ListItemText primary={set.name} secondary={formatSecondary(set)} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}

function formatSecondary(set: BoardSetRecord): string {
  const parts: string[] = [];

  if (set.author) {
    parts.push(`By ${set.author}`);
  }

  parts.push(`${set.boardCount} ${set.boardCount === 1 ? "board" : "boards"}`);

  return parts.join(" · ");
}
