import { useBoard } from "@features/board/context/useBoard";
import type { BoardsetRecord } from "@features/board/db/boards-db";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import type { SelectChangeEvent } from "@mui/material/Select";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router";

export interface BoardSetSelectorProps {
  boardsets: BoardsetRecord[];
  setId: string;
}

export function BoardSetSelector({ boardsets, setId }: BoardSetSelectorProps) {
  const { board } = useBoard();
  const navigate = useNavigate();

  const handleBoardSetChange = (event: SelectChangeEvent<string>) => {
    const selectedSet = boardsets.find((s) => s.setId === event.target.value);
    if (!selectedSet?.rootBoardId) {
      return;
    }

    void navigate(
      `/sets/${selectedSet.setId}/boards/${selectedSet.rootBoardId}`,
    );
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", overflow: "hidden" }}>
      <Select
        sx={{ color: "inherit" }}
        size="small"
        value={setId}
        onChange={handleBoardSetChange}
      >
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
