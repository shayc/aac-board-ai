import type { BoardSummary } from "@features/library";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { m } from "@paraglide/messages.js";
import { useCommunicationLanguage } from "@shared/language/use-communication-language";
import { useTranslate } from "@shared/language/use-translate";
import { useBoardRoute } from "./use-board-route";

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
      sx={{ width: 320, maxWidth: "100%" }}
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
