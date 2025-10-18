import { useBoard } from "@features/board/context/useBoard";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { ToneSelector } from "./ToneSelector/ToneSelector";

export function SuggestionBar() {
  const {
    suggestions,
    suggestionTone,
    setSuggestionTone,
    replaceMessage,
  } = useBoard();

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
        {suggestions?.map((suggestion: string, index: number) => (
          <Chip
            key={index}
            label={suggestion}
            onClick={() =>
              replaceMessage([{ id: suggestion, label: suggestion }])
            }
          />
        ))}
      </Box>

      <ToneSelector
        tone={suggestionTone}
        onChange={(tone) => setSuggestionTone(tone)}
      />
    </Stack>
  );
}
