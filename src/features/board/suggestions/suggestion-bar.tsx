import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { DOT_PROGRESS_SIZE } from "@shared/components/dot-progress";
import type { SuggestionStatusView } from "./derive-suggestion-status";
import { SuggestionStatus } from "./suggestion-status";
import { ToneSelector } from "./tone-selector";

export interface SuggestionBarProps {
  phrases: string[];
  status: SuggestionStatusView;
  tone: RewriterTone;
  canChangeTone: boolean;
  onPhraseClick: (phrase: string) => void;
  onToneChange: (tone: RewriterTone) => void;
  onEnable: () => void;
}

export function SuggestionBar({
  phrases,
  status,
  tone,
  canChangeTone,
  onPhraseClick,
  onToneChange,
  onEnable,
}: SuggestionBarProps) {
  return (
    <Stack
      direction="row"
      sx={{ flex: "1", alignItems: "center", gap: 2, overflow: "hidden" }}
    >
      <Box sx={{ minWidth: DOT_PROGRESS_SIZE }}>
        <SuggestionStatus status={status} onEnable={onEnable} />
      </Box>

      <Box
        sx={{
          height: "100%",
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
            onClick={() => onPhraseClick(phrase)}
          />
        ))}
      </Box>

      {canChangeTone && <ToneSelector tone={tone} onChange={onToneChange} />}
    </Stack>
  );
}
