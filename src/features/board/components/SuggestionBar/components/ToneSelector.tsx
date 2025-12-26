import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";

interface ToneSelectorProps {
  tone: RewriterTone;
  onChange: (tone: RewriterTone) => void;
}

export function ToneSelector({ tone, onChange }: ToneSelectorProps) {
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    tone: RewriterTone | null,
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
      <Tooltip title="Neutral tone" enterDelay={800}>
        <ToggleButton value="as-is" aria-label="neutral tone">
          <DragHandleIcon fontSize="medium" />
        </ToggleButton>
      </Tooltip>

      <Tooltip title="Formal tone" enterDelay={800}>
        <ToggleButton value="more-formal" aria-label="formal tone">
          <BusinessCenterIcon fontSize="medium" />
        </ToggleButton>
      </Tooltip>

      <Tooltip title="Casual tone" enterDelay={800}>
        <ToggleButton value="more-casual" aria-label="casual tone">
          <SentimentSatisfiedAltIcon fontSize="medium" />
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  );
}
