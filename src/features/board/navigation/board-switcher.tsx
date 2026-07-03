import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useBoardNavigation } from "./use-board-navigation";
import { useSetBoards } from "./use-set-boards";

export interface BoardSwitcherProps {
  label: string;
}

export function BoardSwitcher({ label }: BoardSwitcherProps) {
  const { setId, boardId, goToBoard } = useBoardNavigation();
  const { boards } = useSetBoards({ setId });

  const selectedBoard = boards.find((board) => board.boardId === boardId);

  if (!selectedBoard) {
    return (
      <Typography
        variant="h6"
        sx={{
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </Typography>
    );
  }

  return (
    <Autocomplete
      disableClearable
      autoHighlight
      selectOnFocus
      size="small"
      options={boards}
      value={selectedBoard}
      onChange={(_event, board) => goToBoard(board.boardId)}
      getOptionLabel={(board) => board.name}
      getOptionKey={(board) => board.boardId}
      isOptionEqualToValue={(option, selected) =>
        option.boardId === selected.boardId
      }
      sx={{ width: 300, maxWidth: "100%" }}
      renderInput={(params) => <TextField {...params} label={m.board()} />}
    />
  );
}
