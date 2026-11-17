import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Fade from "@mui/material/Fade";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import type { SuggestionStatus } from "./derive-suggestion-status";
import { SuggestionStatusNotice } from "./suggestion-status-notice";

export interface SuggestionBarProps {
  status: SuggestionStatus;
  phrases: readonly string[];
  language: string;
  onEnable: () => void;
  onPhraseSelect: (phrase: string) => void;
}

export function SuggestionBar({
  status,
  phrases,
  language,
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

      {hasPhrases && (
        <Box
          // A live region would interrupt the tile's spoken feedback.
          role="group"
          aria-label={t(m.suggestionsLabel)}
          sx={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            gap: 2,
            overflowX: "auto",
          }}
        >
          {phrases.map((phrase) => (
            <Chip
              key={phrase}
              lang={language}
              label={phrase}
              onClick={() => onPhraseSelect(phrase)}
            />
          ))}
        </Box>
      )}

      <PendingPill isVisible={status.kind === "pending"} />
    </Stack>
  );
}

interface PendingPillProps {
  isVisible: boolean;
}

function PendingPill({ isVisible }: PendingPillProps) {
  const theme = useTheme();

  return (
    <Fade
      in={isVisible}
      mountOnEnter
      unmountOnExit
      // Leaves at once: the last phrase lands in the same render and would
      // push a fading pill past it.
      timeout={{ enter: theme.transitions.duration.enteringScreen, exit: 0 }}
      style={{ transitionDelay: isVisible ? "300ms" : "0ms" }}
    >
      <Box
        data-testid="suggestions-pending"
        sx={{
          display: "flex",
          flexShrink: 0,
          alignItems: "center",
          alignSelf: "stretch",
          gap: 0.75,
          paddingInline: 2,
          border: "1px dashed",
          borderColor: "text.secondary",
          borderRadius: theme.vars.shape.borderRadiusFull,
        }}
      >
        {/* The dots hold still: a loop beside the grid would pull attention
            for as long as the models run. */}
        <PendingPillDot />
        <PendingPillDot />
        <PendingPillDot />
      </Box>
    </Fade>
  );
}

function PendingPillDot() {
  return (
    <Box
      sx={{
        width: 6,
        aspectRatio: "1",
        borderRadius: "50%",
        bgcolor: "text.secondary",
      }}
    />
  );
}
