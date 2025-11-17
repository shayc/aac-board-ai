import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { ToneSelector } from "./ToneSelector/ToneSelector";

export interface SuggestionBarProps {
  suggestions: string[];
  tone: RewriterTone;
  onToneChange: (tone: RewriterTone) => void;
  onSuggestionClick: (suggestion: string) => void;
}

export function SuggestionBar({
  suggestions,
  tone,
  onToneChange,
  onSuggestionClick,
}: SuggestionBarProps) {
  return (
    <Stack direction="row" alignItems="center" px={2} gap={2}>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          marginInlineEnd: "auto",
          overflowX: "auto",
        }}
      >
        {suggestions.map((suggestion: string, index: number) => (
          <Chip
            key={index}
            label={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
          />
        ))}
      </Box>

      <ToneSelector tone={tone} onChange={onToneChange} />
    </Stack>
  );
}
