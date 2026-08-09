import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface SettingSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue: (value: number) => string;
  onChange: (value: number) => void;
}

export function SettingSlider({
  label,
  value,
  min,
  max,
  step,
  formatValue,
  onChange,
}: SettingSliderProps) {
  return (
    <Stack spacing={0.5} role="group" aria-label={label}>
      <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {formatValue(value)}
        </Typography>
      </Stack>
      <Slider
        aria-label={label}
        getAriaValueText={formatValue}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(_event, newValue) => onChange(newValue)}
      />
    </Stack>
  );
}
