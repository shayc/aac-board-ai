import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { ToneSelect } from "./ToneSelect/ToneSelect";

interface SuggestionBarProps {
  suggestions: string[];
}

export function SuggestionBar({ suggestions }: SuggestionBarProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", paddingInline: 1 }}>
      <Box sx={{ display: "flex", gap: 1, marginInlineEnd: "auto" }}>
        {suggestions.map((suggestion, index) => (
          <Chip
            key={index}
            label={suggestion}
            onClick={() => alert(suggestion)}
          />
        ))}
      </Box>

      <ToneSelect />
    </Box>
  );
}
