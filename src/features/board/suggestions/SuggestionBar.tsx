import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import type { SuggestionTone } from "../types";
import { ToneSelector } from "./ToneSelector";

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
