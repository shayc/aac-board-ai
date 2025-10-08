import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { ToneSelect } from "./ToneSelect/ToneSelect";

interface SuggestionBarProps {
  suggestions: string[];
}

export function SuggestionBar({ suggestions }: SuggestionBarProps) {
  return (
    <Box>
      {suggestions.map((suggestion, index) => (
        <Chip
          key={index}
          label={suggestion}
          onClick={() => alert(suggestion)}
        />
      ))}

      <Box sx={{ marginInlineStart: "auto" }}>
        <ToneSelect />
      </Box>
    </Box>
  );
}
