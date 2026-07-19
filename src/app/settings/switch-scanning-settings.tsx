import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useLanguage } from "@shared/language/use-language";
import {
  DWELL_DURATION_MS,
  SCAN_INTERVAL_MS,
  setDwellDurationMs,
  setScanIntervalMs,
  setSwitchScanningEnabled,
  setSwitchScanningMethod,
  type SwitchScanningMethod,
  useSwitchScanningConfig,
} from "@shared/switch-scanning/switch-scanning-store";
import { SwitchInputSetup } from "./switch-input-setup";

const MILLISECONDS_PER_SECOND = 1_000;

function getMethodLabel(method: SwitchScanningMethod): string {
  switch (method) {
    case "auto":
      return m.switchScanningMethodAuto();
    case "step":
      return m.switchScanningMethodStep();
    case "dwell":
      return m.switchScanningMethodDwell();
    case "inverse":
      return m.switchScanningMethodInverse();
  }
}

function getMethodDescription(method: SwitchScanningMethod): string {
  switch (method) {
    case "auto":
      return m.switchScanningMethodAutoDescription();
    case "step":
      return m.switchScanningMethodStepDescription();
    case "dwell":
      return m.switchScanningMethodDwellDescription();
    case "inverse":
      return m.switchScanningMethodInverseDescription();
  }
}

export function SwitchScanningSettings() {
  const { language } = useLanguage();
  const { enabled, method, scanIntervalMs, dwellDurationMs, inputs } =
    useSwitchScanningConfig();

  const seconds = new Intl.NumberFormat(language, {
    style: "unit",
    unit: "second",
    unitDisplay: "long",
    maximumFractionDigits: 1,
  });

  const timing =
    method === "dwell"
      ? {
          label: m.switchScanningDwellDuration(),
          value: dwellDurationMs,
          range: DWELL_DURATION_MS,
          onChange: setDwellDurationMs,
        }
      : method === "auto" || method === "inverse"
        ? {
            label: m.switchScanningInterval(),
            value: scanIntervalMs,
            range: SCAN_INTERVAL_MS,
            onChange: setScanIntervalMs,
          }
        : null;

  return (
    <Stack spacing={3}>
      <FormControlLabel
        labelPlacement="start"
        label={m.switchScanningEnabled()}
        sx={{ justifyContent: "space-between", m: 0 }}
        control={
          <Switch
            checked={enabled}
            onChange={(event) => setSwitchScanningEnabled(event.target.checked)}
          />
        }
      />

      <FormControl size="small" fullWidth>
        <InputLabel id="switch-scanning-method-label">
          {m.switchScanningMethod()}
        </InputLabel>
        <Select
          id="switch-scanning-method"
          labelId="switch-scanning-method-label"
          label={m.switchScanningMethod()}
          value={method}
          onChange={(event) => setSwitchScanningMethod(event.target.value)}
        >
          {(["auto", "dwell", "inverse", "step"] as const).map((option) => (
            <MenuItem key={option} value={option}>
              {getMethodLabel(option)}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText sx={{ color: "text.secondary", mx: 0 }}>
          {getMethodDescription(method)}
        </FormHelperText>
      </FormControl>

      <SwitchInputSetup inputs={inputs} method={method} />

      {timing && (
        <Stack spacing={0.5}>
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", gap: 2 }}
          >
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {timing.label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {seconds.format(timing.value / MILLISECONDS_PER_SECOND)}
            </Typography>
          </Stack>
          <Slider
            aria-label={timing.label}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => seconds.format(value)}
            getAriaValueText={(value) => seconds.format(value)}
            value={timing.value / MILLISECONDS_PER_SECOND}
            min={timing.range.min / MILLISECONDS_PER_SECOND}
            max={timing.range.max / MILLISECONDS_PER_SECOND}
            step={0.1}
            onChange={(_event, value) =>
              timing.onChange(value * MILLISECONDS_PER_SECOND)
            }
          />
          <Stack direction="row" sx={{ justifyContent: "space-between" }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {m.switchScanningFaster()}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {m.switchScanningSlower()}
            </Typography>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
