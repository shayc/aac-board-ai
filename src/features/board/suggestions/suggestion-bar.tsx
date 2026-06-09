import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { SuggestionStatus } from "./suggestion-status";
import { ToneSelector } from "./tone-selector";

export interface SuggestionBarProps {
  suggestions: string[];
  isPending: boolean;
  downloadProgress: number | null;
  needsActivation: boolean;
  hasFailure: boolean;
  tone: RewriterTone;
  canChangeTone: boolean;
  onSuggestionClick: (suggestion: string) => void;
  onToneChange: (tone: RewriterTone) => void;
  onEnable: () => void;
}

export function SuggestionBar({
  suggestions,
  isPending,
  downloadProgress,
  needsActivation,
  hasFailure,
  tone,
  canChangeTone,
  onSuggestionClick,
  onToneChange,
  onEnable,
}: SuggestionBarProps) {
  return (
    <Stack
      direction="row"
      sx={{ flex: "1", alignItems: "center", gap: 2, overflow: "hidden" }}
    >
      <SuggestionStatus
        isPending={isPending}
        downloadProgress={downloadProgress}
        needsActivation={needsActivation}
        hasFailure={hasFailure}
        onEnable={onEnable}
      />

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
