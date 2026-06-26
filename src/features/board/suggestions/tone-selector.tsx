import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import ShortTextOutlinedIcon from "@mui/icons-material/ShortTextOutlined";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";

export interface ToneSelectorProps {
  tone: RewriterTone;
  disabled?: boolean;
  onChange: (tone: RewriterTone) => void;
}

const TONE_VALUES = {
  direct: "as-is",
  professional: "more-formal",
  friendly: "more-casual",
} as const satisfies Record<string, RewriterTone>;

export function ToneSelector({
  tone,
  disabled = false,
  onChange,
}: ToneSelectorProps) {
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    nextTone: RewriterTone | null,
  ) => {
    if (!nextTone) {
      return;
    }

    onChange(nextTone);
  };

  return (
    <ToggleButtonGroup
      aria-label={m.toneSelection()}
      value={tone}
      onChange={handleChange}
      exclusive
      disabled={disabled}
      size="medium"
    >
      <Tooltip title={m.toneDirect()}>
        <ToggleButton aria-label={m.toneDirect()} value={TONE_VALUES.direct}>
          <ShortTextOutlinedIcon fontSize="medium" />
        </ToggleButton>
      </Tooltip>

      <Tooltip title={m.toneProfessional()}>
        <ToggleButton
          aria-label={m.toneProfessional()}
          value={TONE_VALUES.professional}
        >
          <BusinessCenterOutlinedIcon fontSize="medium" />
        </ToggleButton>
      </Tooltip>

      <Tooltip title={m.toneFriendly()}>
        <ToggleButton
          aria-label={m.toneFriendly()}
          value={TONE_VALUES.friendly}
        >
          <SentimentSatisfiedAltIcon fontSize="medium" />
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  );
}
