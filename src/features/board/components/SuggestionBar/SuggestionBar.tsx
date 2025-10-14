import { NavigationButtons } from "@features/board/components/NavigationButtons/NavigationButtons";
import { useBoard } from "@features/board/context/useBoard";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { ToneSelector } from "./ToneSelector/ToneSelector";

export function SuggestionBar() {
  const { suggestions, message } = useBoard();

  return (
    <Box sx={{ display: "flex", alignItems: "center", px: 2, gap: 2 }}>
      <NavigationButtons />

      <Box sx={{ display: "flex", gap: 2, marginInlineEnd: "auto" }}>
        {suggestions.suggestions?.map((suggestion, index) => (
          <Chip
            key={index}
            label={suggestion}
            onClick={() =>
              message.appendPart({ id: suggestion, label: suggestion })
            }
          />
        ))}
      </Box>

      <ToneSelector onChange={suggestions.changeTone} />
    </Box>
  );
}
