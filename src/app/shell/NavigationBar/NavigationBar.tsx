import { useBoard } from "@features/board/context/useBoard";
import type { Boardset } from "@features/board/db/boards-db";
import {
  getBoardset,
  listBoardsets,
  openBoardsDb,
} from "@features/board/db/boards-db";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HomeIcon from "@mui/icons-material/Home";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

export function NavigationBar() {
  const navigate = useNavigate();
  const { setId, boardId } = useParams<{ setId: string; boardId: string }>();
  const [boardsets, setBoardsets] = useState<Boardset[]>([]);
  const [coverBoardId, setCoverBoardId] = useState<string | null>(null);
  const { navigation, board } = useBoard();

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

  useEffect(() => {
    async function loadCoverBoard() {
      if (!setId) {
        setCoverBoardId(null);
        return;
      }

      const db = await openBoardsDb();
      try {
        const boardset = await getBoardset(db, setId);
        if (boardset?.coverBoardId) {
          setCoverBoardId(boardset.coverBoardId);
        } else {
          setCoverBoardId(null);
        }
      } catch (err) {
        console.error("Error loading cover board:", err);
        setCoverBoardId(null);
      } finally {
        db.close();
      }
    }
    loadCoverBoard();
  }, [setId]);

  const handleHomeClick = () => {
    if (setId && coverBoardId) {
      navigate(`/sets/${setId}/boards/${coverBoardId}`);
    }
  };

  const isOnHomePage = coverBoardId && boardId === coverBoardId;

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Tooltip title="Go back" enterDelay={800}>
        <span>
          <IconButton
            onClick={() => navigation.goBack()}
            disabled={!navigation.canGoBack}
            aria-label="Back"
            size="large"
            color="inherit"
          >
            <ArrowBackIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Go home" enterDelay={800}>
        <span>
          <IconButton
            onClick={handleHomeClick}
            disabled={!coverBoardId || !!isOnHomePage}
            aria-label="Home"
            size="large"
            color="inherit"
            sx={{ mr: 2 }}
          >
            <HomeIcon />
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
      {boardId !== coverBoardId && (
        <Typography sx={{ ml: 2 }}>{board.current?.name}</Typography>
      )}
    </Box>
  );
}
