import type { BoardSetRecord } from "@features/board/db/boards-db";
import { BoardSetSelect } from "@features/board/components/BoardSetSelect/BoardSetSelect";
import { useBoardSets } from "@features/board/hooks/useBoardSets";
import MenuIcon from "@mui/icons-material/Menu";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import { useNavigate, useParams } from "react-router";

export interface AppHeaderProps {
  onMenuClick: () => void;
  onSettingsClick: () => void;
}

export function AppHeader({ onMenuClick, onSettingsClick }: AppHeaderProps) {
  const { setId = "" } = useParams<{ setId: string; boardId: string }>();
  const navigate = useNavigate();
  const { boardSets } = useBoardSets();
  const sortedBoardSets = boardSets.toSorted((a, b) =>
    a.name.localeCompare(b.name),
  );

  function handleBoardSetChange(boardSet: BoardSetRecord) {
    if (boardSet.rootBoardId) {
      void navigate(`/sets/${boardSet.setId}/boards/${boardSet.rootBoardId}`);
    }
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <Tooltip title="Open menu">
          <IconButton
            aria-label="Menu"
            size="large"
            edge="start"
            color="inherit"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        </Tooltip>

        {sortedBoardSets.length > 0 && (
          <BoardSetSelect
            boardSets={sortedBoardSets}
            boardSetId={setId}
            onChange={handleBoardSetChange}
          />
        )}

        <Tooltip title="Open settings" sx={{ ml: "auto" }}>
          <IconButton
            aria-label="Settings"
            size="large"
            edge="end"
            color="inherit"
            onClick={onSettingsClick}
          >
            <SettingsOutlinedIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
