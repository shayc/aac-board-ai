import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { m } from "@paraglide/messages.js";
import { useState } from "react";
import { useBoardNavigation } from "./use-board-navigation";
import { useBoardsInSet } from "./use-boards-in-set";

export function BoardSelector() {
  const { setId, boardId, goToBoard } = useBoardNavigation();
  const { boards } = useBoardsInSet({ setId });
  const [inputValue, setInputValue] = useState("");

  const selectedBoard = boards.find((board) => board.boardId === boardId);

  if (!selectedBoard) {
    return null;
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
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps?.input,
              sx: { height: 48, borderRadius: 8 },
            },
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
