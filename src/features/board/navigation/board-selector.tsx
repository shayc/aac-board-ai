import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { useBoardNavigation } from "./use-board-navigation";
import { useBoardOptions } from "./use-board-options";

export function BoardSelector() {
  const t = useTranslate();
  const { boardSetId, boardId, goToBoard } = useBoardNavigation();
  const boards = useBoardOptions(boardSetId);

  const selectedBoard = boards.find((board) => board.id === boardId);

  if (!selectedBoard) {
    return null;
  }

  return (
    <Autocomplete
      openText={t(m.boardSelectorOpen)}
      closeText={t(m.boardSelectorClose)}
      noOptionsText={t(m.boardSelectorNoOptions)}
      options={boards}
      value={selectedBoard}
      onChange={(_event, board) => goToBoard(board.id)}
      disableClearable
      autoHighlight
      size="small"
      slotProps={{
        popupIndicator: { sx: { border: "none" } },
      }}
      getOptionLabel={(board) => board.name}
      getOptionKey={(board) => board.id}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      renderInput={(params) => (
        <TextField
          {...params}
          slotProps={{
            ...params.slotProps,
            htmlInput: {
              ...params.slotProps.htmlInput,
              "aria-label": t(m.boardSelectorLabel),
            },
          }}
        />
      )}
      sx={{ width: 320, maxWidth: "100%" }}
    />
  );
}
