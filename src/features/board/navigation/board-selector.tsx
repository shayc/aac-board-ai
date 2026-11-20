import type { BoardSummary } from "@features/library";
import Autocomplete from "@mui/material/Autocomplete";
import Button, { buttonClasses } from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import OutlinedInput from "@mui/material/OutlinedInput";
import Popover from "@mui/material/Popover";
import type { PopperProps } from "@mui/material/Popper";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { useCommunicationLanguage } from "@shared/language/language-store";
import { useTranslate } from "@shared/language/use-translate";
import { ArrowDropDownIcon, CheckIcon, SearchIcon } from "@shared/ui/icons";
import { type ReactNode, type Ref, useRef, useState } from "react";
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
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const searchFieldRef = useRef<HTMLInputElement>(null);
  const hasFinePointer = useMediaQuery("(pointer: fine)");

  const options = toBoardOptions(boards, language);
  const selectedOption = options.find((option) => option.id === boardId);
  if (!selectedOption) {
    return null;
  }

  const isOpen = anchorElement !== null;

  function handleClose() {
    setAnchorElement(null);
  }

  return (
    <>
      <Typography component="h1" variant="h6">
        <Button
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          color="inherit"
          endIcon={<ArrowDropDownIcon color="action" />}
          onClick={(event) => setAnchorElement(event.currentTarget)}
          sx={{
            maxWidth: "100%",
            // As tall as the icon buttons beside it. The triangle carries its
            // own space, so the end side needs less padding.
            py: 1,
            pl: 2.5,
            pr: 1.5,
            font: "inherit",
            [`& .${buttonClasses.endIcon}`]: { margin: 0 },
            // Button shrinks its icons to 20px. The header's icons are 24px.
            [`& .${buttonClasses.endIcon} > *:nth-of-type(1)`]: {
              fontSize: 24,
            },
          }}
        >
          <Typography component="span" variant="inherit" noWrap>
            {selectedOption.name}
          </Typography>
        </Button>
      </Typography>

      <Popover
        open={isOpen}
        anchorEl={anchorElement}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        slotProps={{
          transition: {
            // On a touch screen, focusing the field would raise the keyboard
            // over the list.
            onEntering: () => {
              if (hasFinePointer) {
                searchFieldRef.current?.focus();
              }
            },
          },
          paper: {
            role: "dialog",
            "aria-label": t(m.boardSelectorLabel),
            sx: { width: 320, mt: 0.5 },
          },
        }}
        onClose={handleClose}
      >
        <BoardSearch
          searchFieldRef={searchFieldRef}
          options={options}
          selectedOption={selectedOption}
          onSelect={goToBoard}
          onClose={handleClose}
        />
      </Popover>
    </>
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

interface BoardSearchProps {
  searchFieldRef: Ref<HTMLInputElement>;
  options: BoardOption[];
  selectedOption: BoardOption;
  onSelect: (boardId: string) => void;
  onClose: () => void;
}

function BoardSearch({
  searchFieldRef,
  options,
  selectedOption,
  onSelect,
  onClose,
}: BoardSearchProps) {
  const t = useTranslate();
  const [query, setQuery] = useState("");

  return (
    <Autocomplete
      noOptionsText={t(m.boardSelectorNoOptions)}
      options={options}
      value={selectedOption}
      onChange={(_event, option) => onSelect(option.id)}
      inputValue={query}
      onInputChange={(_event, value, reason) => {
        // A reset would fill the search field with the current board's name.
        if (reason === "input") {
          setQuery(value);
        }
      }}
      open
      onClose={(_event, reason) => {
        // Choosing the current board changes nothing, so onChange alone would
        // leave the popup open. Blur and a click in the field must not close.
        if (reason === "selectOption" || reason === "escape") {
          onClose();
        }
      }}
      size="small"
      disableClearable
      forcePopupIcon={false}
      autoHighlight
      slots={{ popper: InlineList }}
      slotProps={{
        paper: { elevation: 0 },
        // Autocomplete labels its listbox by the TextField's visible label,
        // which the search field replaces with its aria-label.
        listbox: {
          "aria-labelledby": undefined,
          "aria-label": t(m.boardSelectorLabel),
        },
      }}
      getOptionLabel={(option) => option.name}
      getOptionKey={(option) => option.id}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      renderInput={({ slotProps, size, fullWidth }) => (
        <OutlinedInput
          {...slotProps.input}
          inputRef={searchFieldRef}
          placeholder={t(m.boardSelectorSearch)}
          size={size}
          fullWidth={fullWidth}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          }
          slotProps={{
            input: {
              ...slotProps.htmlInput,
              "aria-label": t(m.boardSelectorSearch),
            },
          }}
        />
      )}
      renderOption={({ key, ...optionProps }, option, { selected }) => (
        <li key={key} {...optionProps}>
          <Typography sx={{ flex: 1 }}>{option.name}</Typography>

          {selected && <CheckIcon fontSize="small" sx={{ ml: 1 }} />}
        </li>
      )}
      sx={{ p: 1 }}
    />
  );
}

// Keeps the options in the popover's flow, under the search field, where
// Autocomplete would float them in a Popper. It only passes elements as children.
function InlineList({ className, children }: PopperProps) {
  return <div className={className}>{children as ReactNode}</div>;
}
