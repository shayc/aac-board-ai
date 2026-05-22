import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import ShortTextOutlinedIcon from "@mui/icons-material/ShortTextOutlined";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import { useLanguage } from "@shared/language/use-language";
import type { SuggestionTone } from "./types";

export interface ToneSelectorProps {
  tone: SuggestionTone;
  onChange: (tone: SuggestionTone) => void;
}

export function ToneSelector({ tone, onChange }: ToneSelectorProps) {
  const { m } = useLanguage();

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
      aria-label={m.toneSelection()}
      value={tone}
      size="medium"
      onChange={handleChange}
    >
      <Tooltip title={m.toneDirect()}>
        <ToggleButton value="as-is" aria-label={m.toneDirect()}>
          <ShortTextOutlinedIcon fontSize="medium" />
        </ToggleButton>
      </Tooltip>

      <Tooltip title={m.toneProfessional()}>
        <ToggleButton value="more-formal" aria-label={m.toneProfessional()}>
          <BusinessCenterOutlinedIcon fontSize="medium" />
        </ToggleButton>
      </Tooltip>

      <Tooltip title={m.toneFriendly()}>
        <ToggleButton value="more-casual" aria-label={m.toneFriendly()}>
          <SentimentSatisfiedAltIcon fontSize="medium" />
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  );
}
