import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import { m } from "@paraglide/messages.js";

export interface ToneSelectorProps {
  tone: RewriterTone;
  disabled?: boolean;
  onChange: (tone: RewriterTone) => void;
}

const TONES = [
  { value: "as-is", label: m.toneDirect },
  { value: "more-formal", label: m.toneProfessional },
  { value: "more-casual", label: m.toneFriendly },
] as const satisfies readonly { value: RewriterTone; label: () => string }[];

export function ToneSelector({
  tone,
  disabled = false,
  onChange,
}: ToneSelectorProps) {
  return (
    <FormControl>
      <FormLabel
        id="tone-selector"
        sx={{ typography: "body2", color: "text.secondary" }}
      >
        {m.toneSelection()}
      </FormLabel>
      <RadioGroup
        aria-labelledby="tone-selector"
        name="tone-selector"
        value={tone}
        onChange={(_event, value) => onChange(value as RewriterTone)}
      >
        {TONES.map(({ value, label }) => (
          <FormControlLabel
            key={value}
            value={value}
            control={<Radio />}
            label={label()}
            disabled={disabled}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
}
