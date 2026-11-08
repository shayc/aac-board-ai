import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { useRouteLoaderData } from "react-router";
import type { Board } from "../board-types";
import { BOARD_ROUTE_ID } from "./board-paths";
import { useBoardNavigation } from "./use-board-navigation";
import { type BoardOption, useBoardOptions } from "./use-board-options";

export function BoardSelector() {
  const board = useRouteLoaderData<Board>(BOARD_ROUTE_ID);

  if (!board) {
    return null;
  }

  return (
    <LoadedBoardSelector currentBoard={{ id: board.id, name: board.name }} />
  );
}

interface LoadedBoardSelectorProps {
  currentBoard: BoardOption;
}

function LoadedBoardSelector({ currentBoard }: LoadedBoardSelectorProps) {
  const t = useTranslate();
  const { boardSetId, goToBoard } = useBoardNavigation();
  const boards = useBoardOptions(boardSetId, currentBoard);

  return (
    <Autocomplete
      openText={t(m.boardSelectorOpen)}
      closeText={t(m.boardSelectorClose)}
      noOptionsText={t(m.boardSelectorNoOptions)}
      options={boards}
      value={currentBoard}
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
