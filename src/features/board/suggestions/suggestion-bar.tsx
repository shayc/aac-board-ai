import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import type { SuggestionStatus } from "./derive-suggestion-status";
import { SuggestionStatusNotice } from "./suggestion-status-notice";

export interface SuggestionBarProps {
  status: SuggestionStatus;
  phrases: readonly string[];
  onEnable: () => void;
  onPhraseSelect: (phrase: string) => void;
}

export function SuggestionBar({
  status,
  phrases,
  onEnable,
  onPhraseSelect,
}: SuggestionBarProps) {
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

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          height: "100%",
          gap: 2,
          marginInlineEnd: "auto",
          overflowX: "auto",
        }}
      >
        {phrases.map((phrase) => (
          <Chip
            key={phrase}
            label={phrase}
            variant="outlined"
            onClick={() => onPhraseSelect(phrase)}
          />
        ))}
      </Box>
    </Stack>
  );
}
