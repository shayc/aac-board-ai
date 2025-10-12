import type { Boardset } from "@features/board/db/boards-db";
import { listBoardsets, openBoardsDb } from "@features/board/db/boards-db";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tooltip from "@mui/material/Tooltip";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

export function NavigationBar() {
  const navigate = useNavigate();
  const { setId } = useParams<{ setId: string }>();
  const [boardsets, setBoardsets] = useState<Boardset[]>([]);

  useEffect(() => {
    async function loadBoardsets() {
      const db = await openBoardsDb();
      try {
        const sets = await listBoardsets(db);
        setBoardsets(sets);
      } finally {
        db.close();
      }
    }
    loadBoardsets();
  }, []);

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Tooltip title="Go back" enterDelay={800}>
        <span>
          <IconButton disabled aria-label="Back" size="large" color="inherit">
            <ArrowBackIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Go forward" enterDelay={800}>
        <span>
          <IconButton
            disabled
            aria-label="Forward"
            size="large"
            color="inherit"
            sx={{ mr: 2 }}
          >
            <ArrowForwardIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Select
        sx={{ color: "inherit" }}
        size="small"
        value={setId || ""}
        onChange={(e) => {
          const selectedSet = boardsets.find((s) => s.setId === e.target.value);
          if (selectedSet?.coverBoardId) {
            navigate(
              `/sets/${selectedSet.setId}/boards/${selectedSet.coverBoardId}`
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
    </Box>
  );
}
