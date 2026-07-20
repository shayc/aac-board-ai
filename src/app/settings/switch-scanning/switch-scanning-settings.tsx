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
import { type Translate, useTranslate } from "@shared/language/use-translate";
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
import { SwitchScanningAdvancedSettings } from "./switch-scanning-advanced-settings";

const MILLISECONDS_PER_SECOND = 1_000;

function getMethodLabel(t: Translate, method: SwitchScanningMethod): string {
  switch (method) {
    case "auto":
      return t(m.switchScanningMethodAuto);
    case "step":
      return t(m.switchScanningMethodStep);
    case "dwell":
      return t(m.switchScanningMethodDwell);
    case "inverse":
      return t(m.switchScanningMethodInverse);
  }
}

function getMethodDescription(
  t: Translate,
  method: SwitchScanningMethod,
): string {
  switch (method) {
    case "auto":
      return t(m.switchScanningMethodAutoDescription);
    case "step":
      return t(m.switchScanningMethodStepDescription);
    case "dwell":
      return t(m.switchScanningMethodDwellDescription);
    case "inverse":
      return t(m.switchScanningMethodInverseDescription);
  }
}

export function SwitchScanningSettings() {
  const t = useTranslate();
  const { language } = useLanguage();
  const config = useSwitchScanningConfig();
  const {
    enabled,
    method,
    scanIntervalMs,
    dwellDurationMs,
    cyclesBeforePausing,
    firstItemPauseMs,
    ignoreRepeatMs,
    minimumPressDurationMs,
    inputs,
  } = config;
  const hasTimedScan = method === "auto" || method === "inverse";

  const seconds = new Intl.NumberFormat(language, {
    style: "unit",
    unit: "second",
    unitDisplay: "long",
    maximumFractionDigits: 1,
  });
  const formatOptionalSeconds = (value: number) =>
    value === 0 ? t(m.switchScanningOff) : seconds.format(value);

  const timing =
    method === "dwell"
      ? {
          label: t(m.switchScanningDwellDuration),
          value: dwellDurationMs,
          range: DWELL_DURATION_MS,
          onChange: setDwellDurationMs,
        }
      : method === "auto" || method === "inverse"
        ? {
            label: t(m.switchScanningInterval),
            value: scanIntervalMs,
            range: SCAN_INTERVAL_MS,
            onChange: setScanIntervalMs,
          }
        : null;

  return (
    <Stack spacing={3}>
      <FormControlLabel
        labelPlacement="start"
        label={t(m.switchScanningEnabled)}
        sx={{ justifyContent: "space-between", m: 0 }}
        control={
          <Switch
            checked={enabled}
            onChange={(event) => setSwitchScanningEnabled(event.target.checked)}
          />
        }
      />

      {enabled && (
        <Stack spacing={3}>
          <FormControl size="small" fullWidth>
            <InputLabel id="switch-scanning-method-label">
              {t(m.switchScanningMethod)}
            </InputLabel>
            <Select
              id="switch-scanning-method"
              labelId="switch-scanning-method-label"
              label={t(m.switchScanningMethod)}
              value={method}
              onChange={(event) => setSwitchScanningMethod(event.target.value)}
            >
              {(["auto", "dwell", "inverse", "step"] as const).map((option) => (
                <MenuItem key={option} value={option}>
                  {getMethodLabel(t, option)}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText sx={{ color: "text.secondary", mx: 0 }}>
              {getMethodDescription(t, method)}
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
                getAriaValueText={(value) => seconds.format(value)}
                value={timing.value / MILLISECONDS_PER_SECOND}
                min={timing.range.min / MILLISECONDS_PER_SECOND}
                max={timing.range.max / MILLISECONDS_PER_SECOND}
                step={0.1}
                onChange={(_event, value) =>
                  timing.onChange(value * MILLISECONDS_PER_SECOND)
                }
              />
            </Stack>
          )}

          <SwitchScanningAdvancedSettings
            cyclesBeforePausing={cyclesBeforePausing}
            firstItemPauseMs={firstItemPauseMs}
            hasTimedScan={hasTimedScan}
            ignoreRepeatMs={ignoreRepeatMs}
            minimumPressDurationMs={minimumPressDurationMs}
            formatSeconds={formatOptionalSeconds}
          />
        </Stack>
      )}
    </Stack>
  );
}
