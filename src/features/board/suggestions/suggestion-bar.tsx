import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { ToneSelector } from "./tone-selector";

export interface SuggestionBarProps {
  suggestions: string[];
  tone: RewriterTone;
  canChangeTone: boolean;
  onToneChange: (tone: RewriterTone) => void;
  onSuggestionClick: (suggestion: string) => void;
}

export function SuggestionBar({
  suggestions,
  tone,
  canChangeTone,
  onToneChange,
  onSuggestionClick,
}: SuggestionBarProps) {
  return (
    <Stack
      direction="row"
      sx={{ flex: "1", alignItems: "center", gap: 2, overflow: "hidden" }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 2,
          marginInlineEnd: "auto",
          overflowX: "auto",
        }}
      >
        {suggestions.map((suggestion) => (
          <Chip
            key={suggestion}
            label={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
          />
        ))}
      </Box>

      {canChangeTone && <ToneSelector tone={tone} onChange={onToneChange} />}
    </Stack>
  );
}
