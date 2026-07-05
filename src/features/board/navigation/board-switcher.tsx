import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useState } from "react";
import { useBoardNavigation } from "./use-board-navigation";
import { useSetBoards } from "./use-set-boards";

export interface BoardSwitcherProps {
  label: string;
}

export function BoardSwitcher({ label }: BoardSwitcherProps) {
  const { setId, boardId, goToBoard } = useBoardNavigation();
  const { boards } = useSetBoards({ setId });
  const [inputValue, setInputValue] = useState("");

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
      size="small"
      options={boards}
      value={selectedBoard}
      inputValue={inputValue}
      onInputChange={(_event, value) => setInputValue(value)}
      onChange={(_event, board) => goToBoard(board.boardId)}
      getOptionLabel={(board) => board.name}
      getOptionKey={(board) => board.boardId}
      isOptionEqualToValue={(option, selected) =>
        option.boardId === selected.boardId
      }
      sx={{ width: 320, maxWidth: "100%" }}
      slotProps={{
        popupIndicator: { sx: { border: "none" } },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={selectedBoard.name}
          onFocus={() => setInputValue("")}
          slotProps={{
            ...params.slotProps,
            htmlInput: {
              ...params.slotProps?.htmlInput,
              "aria-label": m.board(),
            },
          }}
        />
      )}
    />
  );
}
