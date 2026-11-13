import Box from "@mui/material/Box";
import Chip, { chipClasses } from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import type { SuggestionStatus } from "./derive-suggestion-status";
import { SuggestionStatusNotice } from "./suggestion-status-notice";

export interface SuggestionBarProps {
  status: SuggestionStatus;
  phrases: readonly string[];
  onEnable: () => void;
  onPhraseSelect: (phrase: string) => void;
}

export function SuggestionBar({
  status,
  phrases,
  onEnable,
  onPhraseSelect,
}: SuggestionBarProps) {
  const t = useTranslate();
  const hasPhrases = phrases.length > 0;

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
        role={hasPhrases ? "group" : undefined}
        aria-label={hasPhrases ? t(m.suggestionsLabel) : undefined}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          marginInlineEnd: "auto",
          overflowX: "auto",
        }}
      >
        {phrases.map((phrase) => (
          <Chip
            key={phrase}
            label={phrase}
            onClick={() => onPhraseSelect(phrase)}
            sx={suggestionChipSx}
          />
        ))}
      </Box>
    </Stack>
  );
}

function suggestionChipSx(theme: Theme) {
  const { primary, background } = theme.vars.palette;

  return {
    "--suggestion-tint": "16%",
    flexShrink: 0,
    height: 48,
    maxWidth: "none",
    fontSize: theme.typography.pxToRem(16),
    "&, &:hover": {
      bgcolor: `color-mix(in srgb, ${primary.main} var(--suggestion-tint), ${background.paper})`,
    },
    "@media (hover: hover)": {
      "&:hover": { "--suggestion-tint": "24%" },
    },
    // Forced colors replace the fill with the page color.
    "@media (forced-colors: active)": {
      border: "1px solid ButtonText",
    },
    // Keep the keyboard focus ring inside the scrolling row.
    [`&.${chipClasses.focusVisible}`]: { outlineOffset: -3 },
  };
}
