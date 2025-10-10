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
      aria-label="tone selection"
      value={tone}
      size="small"
      onChange={handleChange}
    >
      <Tooltip title="Neutral">
        <ToggleButton value="neutral" aria-label="neutral tone">
          <DragHandleIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Formal">
        <ToggleButton value="formal" aria-label="formal tone">
          <BusinessCenterIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Casual">
        <ToggleButton value="casual" aria-label="casual tone">
          <SentimentSatisfiedAltIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  );
}
