import type { SuggestionTone } from "@features/board/types";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { ToneSelector } from "./components/ToneSelector";

export interface SuggestionBarProps {
  suggestions: string[];
  tone: SuggestionTone;
  onToneChange: (tone: SuggestionTone) => void;
  onSuggestionClick: (suggestion: string) => void;
}

export function SuggestionBar({
  suggestions,
  tone,
  onToneChange,
  onSuggestionClick,
}: SuggestionBarProps) {
  return (
    <Stack
      flex="1"
      direction="row"
      alignItems="center"
      gap={2}
      overflow="hidden"
    >
      <Box
        sx={{
          display: "flex",
          gap: 2,
          marginInlineEnd: "auto",
          overflowX: "auto",
        }}
      >
        {suggestions.map((suggestion, index) => (
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
