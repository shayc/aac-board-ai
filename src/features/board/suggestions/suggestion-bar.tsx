import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { SuggestionStatus } from "./suggestion-status";
import { ToneSelector } from "./tone-selector";
import type { SuggestionStatusView } from "./derive-suggestion-status";

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
      <SuggestionStatus status={status} onEnable={onEnable} />

      <Box
        sx={{
          display: "flex",
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
