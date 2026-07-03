import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import type { SuggestionStatusView } from "./derive-suggestion-status";
import { SuggestionStatus } from "./suggestion-status";

export interface SuggestionBarProps {
  status: SuggestionStatusView;
  phrases: string[];
  onEnable: () => void;
  onPhraseClick: (phrase: string) => void;
}

export function SuggestionBar({
  status,
  phrases,
  onEnable,
  onPhraseClick,
}: SuggestionBarProps) {
  return (
    <Stack
      direction="row"
      sx={{ flex: "1", alignItems: "center", gap: 2, overflow: "hidden" }}
    >
      <SuggestionStatus status={status} onEnable={onEnable} />

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
    </Stack>
  );
}
