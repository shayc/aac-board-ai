import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { m } from "@paraglide/messages.js";
import { useLanguage } from "@shared/language/use-language";
import { useTranslate } from "@shared/language/use-translate";
import type { BoardName } from "../board-types";
import { useBoardNavigation } from "./use-board-navigation";

interface BoardSelectorProps {
  boards: readonly BoardName[];
}

export function BoardSelector({ boards }: BoardSelectorProps) {
  const t = useTranslate();
  const { language } = useLanguage();
  const { boardId, goToBoard } = useBoardNavigation();

  const sortedBoards = boards.toSorted((a, b) =>
    a.name.localeCompare(b.name, language),
  );

  const selectedBoard = sortedBoards.find((board) => board.id === boardId);

  if (!selectedBoard) {
    return null;
  }

  return (
    <Autocomplete
      openText={t(m.boardSelectorOpen)}
      closeText={t(m.boardSelectorClose)}
      noOptionsText={t(m.boardSelectorNoOptions)}
      options={sortedBoards}
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
              ...params.slotProps?.htmlInput,
              "aria-label": t(m.boardSelectorLabel),
            },
          }}
        />
      )}
      sx={{ width: 320, maxWidth: "100%" }}
    />
  );
}
