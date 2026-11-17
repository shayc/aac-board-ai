import type { BoardSummary } from "@features/library";
import Autocomplete from "@mui/material/Autocomplete";
import { outlinedInputClasses } from "@mui/material/OutlinedInput";
import TextField from "@mui/material/TextField";
import { m } from "@paraglide/messages.js";
import { useCommunicationLanguage } from "@shared/language/language-store";
import { useTranslate } from "@shared/language/use-translate";
import { useBoardRoute } from "./use-board-route";

const restingOutline = `& .${outlinedInputClasses.root}:not(:hover, .${outlinedInputClasses.focused}) .${outlinedInputClasses.notchedOutline}`;
const touchHoverOutline = `& .${outlinedInputClasses.root}:hover:not(.${outlinedInputClasses.focused}) .${outlinedInputClasses.notchedOutline}`;

interface BoardOption {
  id: string;
  name: string;
}

interface BoardSelectorProps {
  boards: readonly BoardSummary[];
}

export function BoardSelector({ boards }: BoardSelectorProps) {
  const t = useTranslate();
  const { language } = useCommunicationLanguage();
  const { boardId, goToBoard } = useBoardRoute();

  const options = toBoardOptions(boards, language);
  const selectedOption = options.find((option) => option.id === boardId);
  if (!selectedOption) {
    return null;
  }

  return (
    <Autocomplete
      openText={t(m.boardSelectorOpen)}
      closeText={t(m.boardSelectorClose)}
      noOptionsText={t(m.boardSelectorNoOptions)}
      options={options}
      value={selectedOption}
      onChange={(_event, option) => goToBoard(option.id)}
      disableClearable
      autoHighlight
      size="small"
      slotProps={{
        // Autocomplete labels its listbox by the TextField's visible label,
        // which this selector replaces with the input's aria-label.
        listbox: {
          "aria-labelledby": undefined,
          "aria-label": t(m.boardSelectorLabel),
        },
        popupIndicator: { sx: { border: "none" } },
      }}
      getOptionLabel={(option) => option.name}
      getOptionKey={(option) => option.id}
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
      sx={(theme) => ({
        width: 320,
        maxWidth: "100%",
        // Every other control on the board is a filled shape, so an outline
        // at rest would make the selector the heaviest thing in the header.
        [`& .${outlinedInputClasses.root}`]: {
          backgroundColor: theme.vars.palette.action.hover,
        },
        [restingOutline]: { borderColor: "transparent" },
        // Touch keeps :hover after a tap.
        "@media (hover: none)": {
          [touchHoverOutline]: { borderColor: "transparent" },
        },
      })}
    />
  );
}

function toBoardOptions(
  boards: readonly BoardSummary[],
  language: string,
): BoardOption[] {
  return boards
    .map(({ id, name, translatedNames }) => ({
      id,
      name: translatedNames[language] ?? name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, language));
}
