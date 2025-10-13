import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { ToneSelector } from "./ToneSelector/ToneSelector";
import { NavigationButtons } from "./NavigationButtons/NavigationButtons";

interface SuggestionBarProps {
  suggestions: string[];
  onToneChange: (tone: "neutral" | "formal" | "casual") => void;
}

export function SuggestionBar({
  suggestions,
  onToneChange,
}: SuggestionBarProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", px: 2, gap: 2 }}>
      <NavigationButtons />
      <Box sx={{ display: "flex", gap: 2, marginInlineEnd: "auto" }}>
        {suggestions?.map((suggestion, index) => (
          <Chip
            key={index}
            label={suggestion}
            onClick={() => alert(suggestion)}
          />
        ))}
      </Box>

      <ToneSelector onChange={onToneChange} />
    </Box>
  );
}
