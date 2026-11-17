import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Fade from "@mui/material/Fade";
import Stack from "@mui/material/Stack";
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

const PENDING_PILL_DOTS = [0, 1, 2];

interface PendingPillProps {
  isVisible: boolean;
}

function PendingPill({ isVisible }: PendingPillProps) {
  return (
    <Fade
      in={isVisible}
      mountOnEnter
      unmountOnExit
      style={{ transitionDelay: isVisible ? "300ms" : "0ms" }}
    >
      <Box
        sx={{
          display: "flex",
          flexShrink: 0,
          alignItems: "center",
          gap: 0.75,
          height: 48,
          paddingInline: 2,
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: (theme) => theme.vars.shape.borderRadiusFull,
        }}
      >
        {/* The dots hold still: a loop beside the grid would pull attention
            for as long as the models run. */}
        {PENDING_PILL_DOTS.map((dot) => (
          <Box
            key={dot}
            sx={{
              width: 6,
              aspectRatio: "1",
              borderRadius: "50%",
              bgcolor: "text.secondary",
            }}
          />
        ))}
      </Box>
    </Fade>
  );
}
