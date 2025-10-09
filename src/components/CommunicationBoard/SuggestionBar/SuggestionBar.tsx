import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import { ToneSelect } from "./ToneSelect/ToneSelect";

interface SuggestionBarProps {
  suggestions: string[];
  proofreaderStatus: string;
  onInitializeProofreader: () => Promise<void>;
  onToneChange: (tone: "neutral" | "formal" | "casual") => void;
}

export function SuggestionBar({
  suggestions,
  proofreaderStatus,
  onInitializeProofreader,
  onToneChange,
}: SuggestionBarProps) {
  return (
    <Box
      sx={{ display: "flex", alignItems: "center", paddingInline: 1, gap: 1 }}
    >
      <Box sx={{ display: "flex", gap: 1, marginInlineEnd: "auto" }}>
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
        disabled={
          proofreaderStatus === "ready" || proofreaderStatus === "downloading"
        }
      >
        {proofreaderStatus === "ready"
          ? "✓ Ready"
          : proofreaderStatus === "downloading"
          ? "Downloading..."
          : proofreaderStatus === "downloadable"
          ? "Enable AI"
          : proofreaderStatus === "unsupported"
          ? "Not Supported"
          : proofreaderStatus}
      </Button>

      <ToneSelect onChange={onToneChange} />
    </Box>
  );
}
