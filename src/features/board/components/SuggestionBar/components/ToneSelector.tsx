import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import ShortTextOutlinedIcon from "@mui/icons-material/ShortTextOutlined";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import type { SuggestionTone } from "../../../types";

interface ToneSelectorProps {
  tone: SuggestionTone;
  onChange: (tone: SuggestionTone) => void;
}

export function ToneSelector({ tone, onChange }: ToneSelectorProps) {
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    tone: SuggestionTone | null,
  ) => {
    if (tone) {
      onChange(tone);
    }
  };

  return (
    <ToggleButtonGroup
      exclusive
      aria-label="Tone selection"
      value={tone}
      size="medium"
      onChange={handleChange}
    >
      <Tooltip title="Direct tone">
        <ToggleButton value="as-is" aria-label="direct tone">
          <ShortTextOutlinedIcon fontSize="medium" />
        </ToggleButton>
      </Tooltip>

      <Tooltip title="Professional tone">
        <ToggleButton value="more-formal" aria-label="professional tone">
          <BusinessCenterOutlinedIcon fontSize="medium" />
        </ToggleButton>
      </Tooltip>

      <Tooltip title="Friendly tone">
        <ToggleButton value="more-casual" aria-label="friendly tone">
          <SentimentSatisfiedAltIcon fontSize="medium" />
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  );
}
