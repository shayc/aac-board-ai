import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { DotsProgress } from "@shared/components/dots-progress";
import { ToneSelector } from "./tone-selector";

export interface SuggestionBarProps {
  suggestions: string[];
  isPending: boolean;
  tone: RewriterTone;
  canChangeTone: boolean;
  onSuggestionClick: (suggestion: string) => void;
  onToneChange: (tone: RewriterTone) => void;
}

export function SuggestionBar({
  suggestions,
  isPending,
  tone,
  canChangeTone,
  onSuggestionClick,
  onToneChange,
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

      {isPending && <DotsProgress />}
      {canChangeTone && <ToneSelector tone={tone} onChange={onToneChange} />}
    </Stack>
  );
}
