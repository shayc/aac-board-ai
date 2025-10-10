import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import { ToneSelect } from "./ToneSelect/ToneSelect";

interface SuggestionBarProps {
  suggestions: string[];
  onInitializeProofreader: () => Promise<void>;
  onToneChange: (tone: "neutral" | "formal" | "casual") => void;
}

export function SuggestionBar({
  suggestions,
  onInitializeProofreader,
  onToneChange,
}: SuggestionBarProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", px: 2, gap: 2 }}>
      <Box sx={{ display: "flex", gap: 2, marginInlineEnd: "auto" }}>
        {suggestions.map((suggestion, index) => (
          <Chip
            key={index}
            label={suggestion}
            onClick={() => alert(suggestion)}
          />
        ))}
      </Box>

      {/* Debug button to activate proofreader session */}
      <Button
        variant="outlined"
        size="small"
        onClick={() => void onInitializeProofreader()}
      >
        Init AI
      </Button>

      <ToneSelect onChange={onToneChange} />
    </Box>
  );
}
