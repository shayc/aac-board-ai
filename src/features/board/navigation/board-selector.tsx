import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import visuallyHidden from "@mui/utils/visuallyHidden";
import { m } from "@paraglide/messages.js";
import { useUiLocale } from "@shared/language/language-store";
import { useTranslate } from "@shared/language/use-translate";
import { useId, useState } from "react";
import type { BoardSummary } from "../translation/board-translations";
import { useBoardNavigation } from "./use-board-navigation";

export function BoardSelector({ boards }: { boards: readonly BoardSummary[] }) {
  const t = useTranslate();
  const uiLocale = useUiLocale();
  const labelId = useId();
  const { boardId, goToBoard } = useBoardNavigation();
  // Keep the user's search and keyboard target stable until the popup closes.
  const [popupBoards, setPopupBoards] = useState<
    readonly BoardSummary[] | null
  >(null);
  const options = popupBoards ?? boards;

  const selectedBoard = options.find((board) => board.boardId === boardId);

  if (!selectedBoard) {
    return null;
  }

  return (
    <Autocomplete
      options={options}
      value={selectedBoard}
      onChange={(_event, board) => goToBoard(board.boardId)}
      onOpen={() => setPopupBoards(boards)}
      onClose={() => setPopupBoards(null)}
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
      renderOption={({ key, ...props }, board) => (
        <li key={key} {...props}>
          <bdi lang={board.nameLanguage ?? ""}>{board.name}</bdi>
        </li>
      )}
      renderInput={(params) => (
        <>
          <Box
            id={labelId}
            lang={uiLocale}
            component="span"
            sx={visuallyHidden}
          >
            {t(m.board)}
          </Box>
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
                "aria-labelledby": labelId,
                lang: selectedBoard.nameLanguage ?? "",
                dir: "auto",
              },
            }}
          />
        </>
      )}
      sx={{ width: 320, maxWidth: "100%" }}
    />
  );
}
