import { useBoard } from "@features/board/context/useBoard";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { ToneSelector } from "./ToneSelector/ToneSelector";

export function SuggestionBar() {
  const { suggestions, replaceMessage } = useBoard();

  return (
    <Box sx={{ display: "flex", alignItems: "center", px: 2, gap: 2 }}>
      <Box sx={{ display: "flex", gap: 2, marginInlineEnd: "auto" }}>
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

      <ToneSelector />
    </Box>
  );
}
