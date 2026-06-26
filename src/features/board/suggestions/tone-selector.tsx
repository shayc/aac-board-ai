import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import ShortTextOutlinedIcon from "@mui/icons-material/ShortTextOutlined";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";

export interface ToneSelectorProps {
  tone: RewriterTone;
  disabled?: boolean;
  onChange: (tone: RewriterTone) => void;
}

const TONES = [
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
  return (
    <RadioGroup
      aria-label={m.toneSelection()}
      row
      value={tone}
      onChange={(_event, value) => onChange(value as RewriterTone)}
      sx={(theme) => ({
        display: "inline-flex",
        border: `1px solid ${theme.alpha((theme.vars ?? theme).palette.text.primary, 0.23)}`,
        borderRadius: 7,
        overflow: "hidden",
      })}
    >
      {TONES.map(({ value, label, Icon }) => (
        <Tooltip key={value} title={label()}>
          <Radio
            slotProps={{ input: { "aria-label": label() } }}
            value={value}
            disabled={disabled}
            disableRipple
            icon={<Icon fontSize="medium" />}
            checkedIcon={<Icon fontSize="medium" />}
            sx={(theme) => ({
              padding: 1.5,
              color: "action.active",
              "&:hover": {
                backgroundColor: "action.hover",
                "@media (hover: none)": { backgroundColor: "transparent" },
              },
              "&.Mui-checked": {
                color: "text.primary",
                backgroundColor: "action.selected",
                "&:hover": {
                  backgroundColor: theme.alpha(
                    (theme.vars ?? theme).palette.text.primary,
                    `${(theme.vars ?? theme).palette.action.selectedOpacity} + ${(theme.vars ?? theme).palette.action.hoverOpacity}`,
                  ),
                  "@media (hover: none)": {
                    backgroundColor: "action.selected",
                  },
                },
              },
              "&.Mui-disabled": { color: "action.disabled" },
            })}
          />
        </Tooltip>
      ))}
    </RadioGroup>
  );
}
