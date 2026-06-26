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

const TONE_OPTIONS = [
  { value: "as-is", label: m.toneDirect, Icon: ShortTextOutlinedIcon },
  {
    value: "more-formal",
    label: m.toneProfessional,
    Icon: BusinessCenterOutlinedIcon,
  },
  {
    value: "more-casual",
    label: m.toneFriendly,
    Icon: SentimentSatisfiedAltIcon,
  },
] as const satisfies readonly {
  value: RewriterTone;
  label: () => string;
  Icon: typeof ShortTextOutlinedIcon;
}[];

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
      {TONE_OPTIONS.map(({ value, label, Icon }) => {
        const button = (
          <ToggleButton key={value} aria-label={label()} value={value}>
            <Icon fontSize="medium" />
          </ToggleButton>
        );

        return disabled ? (
          button
        ) : (
          <Tooltip key={value} title={label()}>
            {button}
          </Tooltip>
        );
      })}
    </ToggleButtonGroup>
  );
}
