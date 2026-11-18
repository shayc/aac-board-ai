import type { BoardSummary } from "@features/library";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SearchIcon from "@mui/icons-material/Search";
import Autocomplete from "@mui/material/Autocomplete";
import Button, { buttonClasses } from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import InputBase from "@mui/material/InputBase";
import Popover from "@mui/material/Popover";
import type { PopperProps } from "@mui/material/Popper";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { useCommunicationLanguage } from "@shared/language/language-store";
import { useTranslate } from "@shared/language/use-translate";
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
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const searchFieldRef = useRef<HTMLInputElement>(null);
  const hasFinePointer = useMediaQuery("(pointer: fine)");

  const options = toBoardOptions(boards, language);
  const selectedOption = options.find((option) => option.id === boardId);
  if (!selectedOption) {
    return null;
  }

  const isOpen = anchor !== null;
  const close = () => setAnchor(null);

  return (
    <>
      <Typography component="h1" variant="h6" sx={{ minWidth: 0 }}>
        <Button
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          color="inherit"
          endIcon={<ArrowDropDownIcon />}
          onClick={(event) => setAnchor(event.currentTarget)}
          sx={{
            maxWidth: "100%",
            // 48px tall, the height of the icon buttons beside it. The end
            // side is narrower because the triangle carries its own space.
            py: 1,
            pl: 2.5,
            pr: 1.5,
            font: "inherit",
            [`& .${buttonClasses.endIcon}`]: { margin: 0 },
          }}
        >
          <Typography component="span" variant="inherit" noWrap>
            {selectedOption.name}
          </Typography>
        </Button>
      </Typography>

      <Popover
        open={isOpen}
        anchorEl={anchor}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        slotProps={{
          transition: {
            // A touch screen would raise its keyboard over the list the person
            // came to read, so only a device with a mouse starts in the search
            // field.
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
        onClose={close}
      >
        <BoardSearch
          searchFieldRef={searchFieldRef}
          options={options}
          selectedOption={selectedOption}
          onSelect={goToBoard}
          onClose={close}
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
        if (reason === "selectOption" || reason === "escape") {
          onClose();
        }
      }}
      disableClearable
      autoHighlight
      forcePopupIcon={false}
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
      renderInput={({ slotProps }) => (
        <InputBase
          ref={slotProps.input.ref}
          inputRef={searchFieldRef}
          fullWidth
          placeholder={t(m.boardSelectorSearch)}
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
          sx={(theme) => ({
            borderBottom: `1px solid ${theme.vars.palette.divider}`,
            px: 2,
            py: 1,
          })}
        />
      )}
    />
  );
}

// Renders the options in the popover's flow, under the search field, where
// Autocomplete would float them in a Popper of their own.
function InlineList({ className, children }: PopperProps) {
  return <div className={className}>{children as ReactNode}</div>;
}
