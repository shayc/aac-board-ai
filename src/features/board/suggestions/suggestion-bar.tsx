import type { BoardButton } from "@features/library";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import type { SuggestionStatus } from "./derive-suggestion-status";
import { SuggestionStatusNotice } from "./suggestion-status-notice";

export interface SuggestionBarProps {
  status: SuggestionStatus;
  phrases: readonly string[];
  nextWordButtons: readonly BoardButton[];
  language: string;
  onEnable: () => void;
  onPhraseSelect: (phrase: string) => void;
  onNextWordSelect: (button: BoardButton) => void;
}

export function SuggestionBar({
  status,
  phrases,
  nextWordButtons,
  language,
  onEnable,
  onPhraseSelect,
  onNextWordSelect,
}: SuggestionBarProps) {
  const t = useTranslate();
  const hasSuggestions = phrases.length + nextWordButtons.length > 0;

  return (
    <Stack
      direction="row"
      sx={{
        flex: "1",
        alignItems: "center",
        minHeight: 48,
        gap: 2,
        overflow: "hidden",
      }}
    >
      <SuggestionStatusNotice status={status} onEnable={onEnable} />

      <Box
        // A live region would interrupt the tile's spoken feedback.
        role={hasSuggestions ? "group" : undefined}
        aria-label={hasSuggestions ? t(m.suggestionsLabel) : undefined}
        sx={{
          display: "flex",
          alignItems: "center",
          height: "100%",
          gap: 2,
          marginInlineEnd: "auto",
          overflowX: "auto",
        }}
      >
        {nextWordButtons.map((button) => (
          <Chip
            key={`word/${button.id}`}
            lang={language}
            avatar={
              button.imageSrc ? (
                <Avatar
                  alt=""
                  src={button.imageSrc}
                  // Symbols are drawn for light tiles and vanish on a dark chip.
                  sx={{
                    p: 0.25,
                    bgcolor: "common.white",
                    "& .MuiAvatar-img": { objectFit: "contain" },
                  }}
                />
              ) : undefined
            }
            label={button.label}
            variant="outlined"
            onClick={() => onNextWordSelect(button)}
          />
        ))}

        {phrases.map((phrase) => (
          <Chip
            key={phrase}
            lang={language}
            label={phrase}
            onClick={() => onPhraseSelect(phrase)}
          />
        ))}
      </Box>
    </Stack>
  );
}
