import type { BoardSummary } from "@features/library";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { m } from "@paraglide/messages.js";
import { useLanguage } from "@shared/language/use-language";
import { useTranslate } from "@shared/language/use-translate";

interface BoardOption {
  id: string;
  name: string;
}

interface BoardSelectorProps {
  boards: readonly BoardSummary[];
  boardId: string;
  onSelect: (boardId: string) => void;
}

export function BoardSelector({
  boards,
  boardId,
  onSelect,
}: BoardSelectorProps) {
  const t = useTranslate();
  const { language } = useLanguage();
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
      onChange={(_event, option) => onSelect(option.id)}
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
