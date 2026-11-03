import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId } from "react";

interface SettingsSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  formatValue: (value: number) => string;
}

export function SettingsSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  formatValue,
}: SettingsSliderProps) {
  const labelId = useId();

  return (
    <Stack spacing={0.5}>
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "baseline", gap: 2 }}
      >
        <Typography id={labelId}>{label}</Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", fontWeight: "fontWeightBold" }}
        >
          {formatValue(value)}
        </Typography>
      </Stack>
      <Slider
        aria-labelledby={labelId}
        getAriaValueText={formatValue}
        value={value}
        onChange={(_event, newValue) => onChange(newValue)}
        min={min}
        max={max}
        step={step}
      />
    </Stack>
  );
}
