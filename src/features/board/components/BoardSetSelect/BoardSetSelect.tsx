import type { BoardSetRecord } from "@features/board/db/boards-db";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

export interface BoardSetSelectProps {
  boardSets: BoardSetRecord[];
  boardSetId: string;
  onChange: (boardSet: BoardSetRecord) => void;
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
      onChange={(event) => {
        const selected = boardSets.find((s) => s.setId === event.target.value);

        if (selected) {
          onChange(selected);
        }
      }}
    >
      {boardSets.map((set) => (
        <MenuItem key={set.setId} value={set.setId}>
          {set.name}
        </MenuItem>
      ))}
    </Select>
  );
}
