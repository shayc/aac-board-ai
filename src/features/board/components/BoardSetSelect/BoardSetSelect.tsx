import { useBoard } from "@features/board/context/useBoard";
import type { BoardSetRecord } from "@features/board/db/boards-db";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router";

interface BoardSetSelectProps {
  boardSets: BoardSetRecord[];
  boardSetId: string;
}

export function BoardSetSelect({ boardSets, boardSetId }: BoardSetSelectProps) {
  const navigate = useNavigate();
  const { board } = useBoard();

  return (
    <Box sx={{ display: "flex", alignItems: "center", overflow: "hidden" }}>
      <Select
        sx={{ color: "inherit" }}
        size="small"
        value={boardSetId}
        onChange={(e) => {
          const selectedSet = boardSets.find((s) => s.setId === e.target.value);
          if (selectedSet?.rootBoardId) {
            void navigate(
              `/sets/${selectedSet.setId}/boards/${selectedSet.rootBoardId}`,
            );
          }
        }}
      >
        {boardSets.map((set) => (
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
