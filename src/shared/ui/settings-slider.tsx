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
  normalValue?: number;
  formatValue: (value: number) => string;
  minLabel: string;
  maxLabel: string;
}

export function SettingsSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  normalValue,
  formatValue,
  minLabel,
  maxLabel,
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
        marks={normalValue === undefined ? false : [{ value: normalValue }]}
      />

      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          gap: 2,
          color: "text.secondary",
        }}
      >
        <Typography variant="caption">{minLabel}</Typography>
        <Typography variant="caption">{maxLabel}</Typography>
      </Stack>
    </Stack>
  );
}
