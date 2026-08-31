import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import type { SuggestionStatusView } from "./derive-suggestion-status";
import { PendingDot } from "./pending-dot";
import { SuggestionStatus } from "./suggestion-status";

export interface SuggestionBarProps {
  status: SuggestionStatusView;
  phrases: string[];
  onEnable: () => void;
  onPhraseSelect: (phrase: string) => void;
}

export function SuggestionBar({
  status,
  phrases,
  onEnable,
  onPhraseSelect,
}: SuggestionBarProps) {
  const isPending = status?.kind === "pending";

  return (
    <Stack
      direction="row"
      sx={{
        flex: "1",
        alignItems: "center",
        gap: 2,
        minHeight: 32,
        overflow: "hidden",
      }}
    >
      {(status === null || isPending) && <PendingDot show={isPending} />}

      <SuggestionStatus status={status} onEnable={onEnable} />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          height: "100%",
          marginInlineEnd: "auto",
          overflowX: "auto",
        }}
      >
        {phrases.map((phrase) => (
          <Chip
            key={phrase}
            label={phrase}
            onClick={() => onPhraseSelect(phrase)}
          />
        ))}
      </Box>
    </Stack>
  );
}
