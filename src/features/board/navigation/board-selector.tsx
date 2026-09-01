import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { useBoardNavigation } from "./use-board-navigation";
import { useBoardsInSet } from "./use-boards-in-set";

export function BoardSelector() {
  const t = useTranslate();
  const { setId, boardId, goToBoard } = useBoardNavigation();
  const { boards } = useBoardsInSet(setId);

  const selectedBoard = boards.find((board) => board.boardId === boardId);

  if (!selectedBoard) {
    return null;
  }

  return (
    <Autocomplete
      options={boards}
      value={selectedBoard}
      onChange={(_event, board) => goToBoard(board.boardId)}
      disableClearable
      autoHighlight
      size="small"
      slotProps={{
        popupIndicator: { sx: { border: "none" } },
      }}
      getOptionLabel={(board) => board.name}
      getOptionKey={(board) => board.boardId}
      isOptionEqualToValue={(option, selected) =>
        option.boardId === selected.boardId
      }
      renderInput={(params) => (
        <TextField
          {...params}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps?.input,
              sx: { borderRadius: 8 },
            },
            htmlInput: {
              ...params.slotProps?.htmlInput,
              "aria-label": t(m.board),
            },
          }}
        />
      )}
      sx={{ width: 320, maxWidth: "100%" }}
    />
  );
}
