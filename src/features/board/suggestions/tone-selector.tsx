import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import ShortTextOutlinedIcon from "@mui/icons-material/ShortTextOutlined";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";

export interface ToneSelectorProps {
  tone: RewriterTone;
  onChange: (tone: RewriterTone) => void;
}

const TONE_VALUES = {
  direct: "as-is",
  professional: "more-formal",
  friendly: "more-casual",
} as const satisfies Record<string, RewriterTone>;

export function ToneSelector({ tone, onChange }: ToneSelectorProps) {
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    nextTone: RewriterTone | null,
  ) => {
    if (nextTone) {
      onChange(nextTone);
    }
  };

  return (
    <ToggleButtonGroup
      exclusive
      aria-label={m.toneSelection()}
      value={tone}
      size="medium"
      onChange={handleChange}
    >
      <Tooltip title={m.toneDirect()}>
        <ToggleButton value={TONE_VALUES.direct} aria-label={m.toneDirect()}>
          <ShortTextOutlinedIcon fontSize="medium" />
        </ToggleButton>
      </Tooltip>

      <Tooltip title={m.toneProfessional()}>
        <ToggleButton
          value={TONE_VALUES.professional}
          aria-label={m.toneProfessional()}
        >
          <BusinessCenterOutlinedIcon fontSize="medium" />
        </ToggleButton>
      </Tooltip>

      <Tooltip title={m.toneFriendly()}>
        <ToggleButton
          value={TONE_VALUES.friendly}
          aria-label={m.toneFriendly()}
        >
          <SentimentSatisfiedAltIcon fontSize="medium" />
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  );
}
