import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Fade from "@mui/material/Fade";
import Stack from "@mui/material/Stack";
import { keyframes, useTheme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import type { SuggestionStatus } from "./derive-suggestion-status";
import { SuggestionStatusNotice } from "./suggestion-status-notice";

// A keyframe, not a transition: the theme owns the chip's transitions for
// press feedback.
const phraseEnter = keyframes`
  from { opacity: 0; }
`;

// Opacity only, so nothing beside the grid moves or changes size.
const pendingPulse = keyframes`
  0%, 60%, 100% { opacity: 0.5; }
  30% { opacity: 1; }
`;

// A first phrase mostly arrives within about 600ms, so a shorter wait would
// flash the pill just before the phrase takes its place.
const PENDING_PILL_DELAY_MS = 700;

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
              sx={(theme) => ({
                animation: `${phraseEnter} ${theme.transitions.duration.shortest}ms ${theme.transitions.easing.easeOut}`,
                "@media (prefers-reduced-motion: reduce)": {
                  animation: "none",
                },
              })}
            />
          ))}
        </Box>
      )}

      <PendingPill
        // The pill moves when the first phrase arrives and when the phrases
        // clear, so it waits again instead of jumping there at full strength.
        key={hasPhrases ? "after-phrases" : "alone"}
        isVisible={status.kind === "pending"}
      />
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
      style={{
        transitionDelay: isVisible ? `${PENDING_PILL_DELAY_MS}ms` : "0ms",
      }}
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
          borderRadius: theme.vars.shape.borderRadiusFull,
          bgcolor: "action.hover",
        }}
      >
        <PendingPillDot delayMs={0} />
        <PendingPillDot delayMs={150} />
        <PendingPillDot delayMs={300} />
      </Box>
    </Fade>
  );
}

interface PendingPillDotProps {
  delayMs: number;
}

function PendingPillDot({ delayMs }: PendingPillDotProps) {
  return (
    <Box
      sx={{
        width: 6,
        aspectRatio: "1",
        borderRadius: "50%",
        bgcolor: "text.secondary",
        animation: `${pendingPulse} 1.4s ease-in-out ${delayMs}ms infinite`,
        "@media (prefers-reduced-motion: reduce)": {
          animation: "none",
        },
      }}
    />
  );
}
