import type { BoardsetRecord } from "@features/board/db/boards-db";
import { listBoardsets, openBoardsDB } from "@features/board/db/boards-db";
import MenuIcon from "@mui/icons-material/Menu";
import SettingsIcon from "@mui/icons-material/Settings";
import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { BoardSetSelector } from "./BoardSetSelector/BoardSetSelector";

interface AppHeaderProps {
  onMenuClick: () => void;
  onSettingsClick: () => void;
}

export function AppHeader({ onMenuClick, onSettingsClick }: AppHeaderProps) {
  const { setId = "" } = useParams<{ setId: string; boardId: string }>();
  const [boardsets, setBoardsets] = useState<BoardsetRecord[]>([]);

  useEffect(() => {
    async function loadBoardsets() {
      const db = await openBoardsDB();

      try {
        const sets = await listBoardsets(db);
        setBoardsets(sets);
      } finally {
        db.close();
      }
    }

    void loadBoardsets();
    // TODO: remove setId from dependencies
  }, [setId]);

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

        {boardsets.length > 0 && (
          <BoardSetSelector boardsets={boardsets} setId={setId} />
        )}

        <Tooltip title="Open settings" sx={{ ml: "auto" }}>
          <IconButton
            aria-label="Settings"
            size="large"
            edge="end"
            color="inherit"
            onClick={onSettingsClick}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
