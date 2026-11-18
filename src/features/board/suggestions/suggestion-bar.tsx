import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { keyframes } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import type { FocusEvent } from "react";
import { SCAN_OUTLINE_REACH_PX } from "../scanning/scan-targets";
import type { SuggestionStatus } from "./derive-suggestion-status";
import { SuggestionStatusNotice } from "./suggestion-status-notice";

// A keyframe, not a transition: the theme owns the chip's transitions for
// press feedback, and a keyframe starts over each time its element mounts.
const fadeIn = keyframes`
  from { opacity: 0; }
`;

// Opacity only, so nothing beside the grid moves or changes size.
const pendingPulse = keyframes`
  0%, 60%, 100% { opacity: 0.5; }
  30% { opacity: 1; }
`;

// A first phrase mostly arrives within 600ms; a shorter wait flashes the dots.
const PENDING_DOTS_DELAY_MS = 700;

// Room for the widest outline a chip gets, the scan highlight. A scroll
// container clips at its padding edge.
const OUTLINE_CLEARANCE = `${SCAN_OUTLINE_REACH_PX}px`;

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
        minWidth: 0,
        minHeight: 48,
        gap: 2,
      }}
    >
      <SuggestionStatusNotice status={status} onEnable={onEnable} />

      {hasPhrases && (
        <Box
          // A live region would interrupt the tile's spoken feedback.
          role="group"
          aria-label={t(m.suggestionsLabel)}
          onFocus={revealKeyboardFocusedChip}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            // The margin takes the padding back, so the row keeps its size.
            p: OUTLINE_CLEARANCE,
            m: `-${OUTLINE_CLEARANCE}`,
            overflowX: "auto",
            scrollPaddingInline: OUTLINE_CLEARANCE,
          }}
        >
          {phrases.map((phrase) => (
            <Chip
              key={phrase}
              lang={language}
              label={phrase}
              onClick={() => onPhraseSelect(phrase)}
              sx={(theme) => ({
                animation: `${fadeIn} ${theme.transitions.duration.shortest}ms ${theme.transitions.easing.easeOut}`,
                "@media (prefers-reduced-motion: reduce)": {
                  animation: "none",
                },
              })}
            />
          ))}
        </Box>
      )}

      {status.kind === "pending" && (
        <PendingDots
          // The dots move when the first phrase arrives and when the phrases
          // clear, so they wait again instead of jumping there at full strength.
          key={hasPhrases ? "after-phrases" : "alone"}
        />
      )}
    </Stack>
  );
}

// Browsers leave a partly visible chip where it is on Tab, so its focus ring
// stays cut off. A tapped chip shows no ring and stays put.
function revealKeyboardFocusedChip({ target }: FocusEvent) {
  if (target.matches(":focus-visible")) {
    target.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
}

// Rendered only while pending, so they leave at once: the last phrase lands in
// the same render and would push fading dots past it. No fill or outline:
// a shape around the dots reads as one more chip to tap.
function PendingDots() {
  return (
    <Box
      data-testid="suggestions-pending"
      sx={(theme) => ({
        display: "flex",
        flexShrink: 0,
        alignItems: "center",
        gap: 0.75,
        paddingInline: 1.5,
        animation: `${fadeIn} ${theme.transitions.duration.enteringScreen}ms ${theme.transitions.easing.easeOut} ${PENDING_DOTS_DELAY_MS}ms backwards`,
      })}
    >
      <PendingDot delayMs={0} />
      <PendingDot delayMs={150} />
      <PendingDot delayMs={300} />
    </Box>
  );
}

interface PendingDotProps {
  delayMs: number;
}

function PendingDot({ delayMs }: PendingDotProps) {
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
