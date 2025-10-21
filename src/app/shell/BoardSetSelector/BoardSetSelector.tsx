import { useBoard } from "@features/board/context/useBoard";
import type { BoardsetRecord } from "@features/board/db/boards-db";
import {
  getBoardset,
  listBoardsets,
  openBoardsDB,
} from "@features/board/db/boards-db";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

export function BoardSetSelector() {
  const navigate = useNavigate();
  const { setId, boardId } = useParams<{ setId: string; boardId: string }>();
  const [boardsets, setBoardsets] = useState<BoardsetRecord[]>([]);
  const [rootBoardId, setRootBoardId] = useState<string | null>(null);
  const { board } = useBoard();

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

    loadBoardsets();
  }, []);

  useEffect(() => {
    async function loadRootBoard() {
      if (!setId) {
        setRootBoardId(null);
        return;
      }

      const db = await openBoardsDB();

      try {
        const boardset = await getBoardset(db, setId);

        if (boardset?.rootBoardId) {
          setRootBoardId(boardset.rootBoardId);
        } else {
          setRootBoardId(null);
        }
      } catch (err) {
        console.error("Error loading cover board:", err);
        setRootBoardId(null);
      } finally {
        db.close();
      }
    }

    loadRootBoard();
  }, [setId]);

  return (
    <Box sx={{ display: "flex", alignItems: "center", overflow: "hidden" }}>
      <Select
        sx={{ color: "inherit" }}
        size="small"
        value={setId || ""}
        onChange={(e) => {
          const selectedSet = boardsets.find((s) => s.setId === e.target.value);
          if (selectedSet?.rootBoardId) {
            navigate(
              `/sets/${selectedSet.setId}/boards/${selectedSet.rootBoardId}`
            );
          }
        }}
        displayEmpty
      >
        {boardsets.length === 0 && (
          <MenuItem value="">No boards imported</MenuItem>
        )}

        {boardsets.map((set) => (
          <MenuItem key={set.setId} value={set.setId}>
            {set.name}
          </MenuItem>
        ))}
      </Select>

      <Typography noWrap sx={{ ml: 2 }}>
        {board?.name}
      </Typography>
    </Box>
  );
}
