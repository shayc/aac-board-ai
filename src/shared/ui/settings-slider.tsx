import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId, type ReactNode } from "react";

interface SettingsSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  formatValue: (value: number) => string;
  isValueVisible?: boolean;
  hasStepMarks?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export function SettingsSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  formatValue,
  isValueVisible = true,
  hasStepMarks = false,
  startIcon,
  endIcon,
}: SettingsSliderProps) {
  const labelId = useId();

  return (
    <Stack spacing={0.5}>
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "baseline", gap: 2 }}
      >
        <Typography id={labelId}>{label}</Typography>
        {isValueVisible && (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontWeight: "fontWeightBold" }}
          >
            {formatValue(value)}
          </Typography>
        )}
      </Stack>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        {startIcon}
        <Slider
          aria-labelledby={labelId}
          getAriaValueText={formatValue}
          value={value}
          onChange={(_event, newValue) => onChange(newValue)}
          min={min}
          max={max}
          step={step}
          marks={hasStepMarks}
        />
        {endIcon}
      </Stack>
    </Stack>
  );
}
