import type { BoardSetRecord } from "@features/board/db/boards-db";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";

interface BoardSetSelectProps {
  boardSets: BoardSetRecord[];
  boardSetId: string;
  onChange: (event: SelectChangeEvent<string>, child: React.ReactNode) => void;
}

export function BoardSetSelect({
  boardSets,
  boardSetId,
  onChange,
}: BoardSetSelectProps) {
  return (
    <Select
      sx={{ color: "inherit" }}
      size="small"
      value={boardSetId}
      onChange={onChange}
    >
      {boardSets.map((set) => (
        <MenuItem key={set.setId} value={set.setId}>
          {set.name}
        </MenuItem>
      ))}
    </Select>
  );
}
