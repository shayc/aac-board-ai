import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
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
import { SettingSlider } from "../setting-slider";
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

interface TimingSetting {
  label: string;
  value: number;
  range: { min: number; max: number };
  onChange: (value: number) => void;
}

function getTimingSetting(
  t: Translate,
  method: SwitchScanningMethod,
  scanIntervalMs: number,
  dwellDurationMs: number,
): TimingSetting | null {
  switch (method) {
    case "dwell":
      return {
        label: t(m.switchScanningDwellDuration),
        value: dwellDurationMs,
        range: DWELL_DURATION_MS,
        onChange: setDwellDurationMs,
      };
    case "auto":
    case "inverse":
      return {
        label: t(m.switchScanningInterval),
        value: scanIntervalMs,
        range: SCAN_INTERVAL_MS,
        onChange: setScanIntervalMs,
      };
    case "step":
      return null;
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

  const timing = getTimingSetting(t, method, scanIntervalMs, dwellDurationMs);

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
            <SettingSlider
              label={timing.label}
              value={timing.value / MILLISECONDS_PER_SECOND}
              min={timing.range.min / MILLISECONDS_PER_SECOND}
              max={timing.range.max / MILLISECONDS_PER_SECOND}
              step={0.1}
              formatValue={(value) => seconds.format(value)}
              onChange={(value) =>
                timing.onChange(value * MILLISECONDS_PER_SECOND)
              }
            />
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
