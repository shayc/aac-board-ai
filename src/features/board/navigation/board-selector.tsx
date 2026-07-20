import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { useState } from "react";
import type { BoardSummary } from "./board-summaries";
import { useBoardNavigation } from "./use-board-navigation";

interface BoardSelectorProps {
  boards: BoardSummary[];
}

export function BoardSelector({ boards }: BoardSelectorProps) {
  const t = useTranslate();
  const { boardId, goToBoard } = useBoardNavigation();
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
              "aria-label": t(m.board),
            },
          }}
        />
      )}
    />
  );
}
