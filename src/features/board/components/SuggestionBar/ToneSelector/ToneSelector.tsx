import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import { useState } from "react";

type ToneOption = "neutral" | "formal" | "casual";

interface ToneSelectorProps {
  onChange?: (tone: ToneOption) => void;
}

export function ToneSelector({ onChange }: ToneSelectorProps) {
  const [tone, setTone] = useState<ToneOption>("neutral");

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTone: ToneOption | null
  ) => {
    if (newTone) {
      setTone(newTone);
      onChange?.(newTone);
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
      <Tooltip title="Neutral tone" enterDelay={1000}>
        <ToggleButton value="neutral" aria-label="neutral tone">
          <DragHandleIcon fontSize="medium" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Formal tone" enterDelay={1000}>
        <ToggleButton value="formal" aria-label="formal tone">
          <BusinessCenterIcon fontSize="medium" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Casual tone" enterDelay={1000}>
        <ToggleButton value="casual" aria-label="casual tone">
          <SentimentSatisfiedAltIcon fontSize="medium" />
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  );
}
