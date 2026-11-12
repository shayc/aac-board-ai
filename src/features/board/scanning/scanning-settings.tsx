import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import { m } from "@paraglide/messages.js";
import { useUILocale } from "@shared/language/language-store";
import { useTranslate } from "@shared/language/use-translate";
import { SettingsRadioGroup } from "@shared/ui/settings-radio-group";
import { SettingsSlider } from "@shared/ui/settings-slider";
import { SettingsSwitch } from "@shared/ui/settings-switch";
import {
  SCAN_INTERVAL_MS,
  setScanIntervalMs,
  setScanMethod,
  setScanningEnabled,
  useScanningPreferences,
} from "./scanning-preferences-store";

const MS_PER_SECOND = 1000;

export function ScanningSettings() {
  const t = useTranslate();
  const uiLocale = useUILocale();
  const { isEnabled, method, intervalMs } = useScanningPreferences();

  const secondsFormat = new Intl.NumberFormat(uiLocale, {
    style: "unit",
    unit: "second",
    minimumFractionDigits: 1,
  });

  return (
    <>
      <SettingsSwitch
        label={t(m.scanningEnabled)}
        checked={isEnabled}
        onChange={setScanningEnabled}
      />

      {isEnabled && (
        <SettingsRadioGroup
          label={t(m.scanningMethod)}
          helperText={
            method === "auto"
              ? t(m.scanningMethodAutoHint)
              : t(m.scanningMethodStepHint)
          }
          value={method}
          onChange={setScanMethod}
        >
          <FormControlLabel
            value="auto"
            control={<Radio />}
            label={t(m.scanningMethodAuto)}
          />

          <FormControlLabel
            value="step"
            control={<Radio />}
            label={t(m.scanningMethodStep)}
          />
        </SettingsRadioGroup>
      )}

      {isEnabled && method === "auto" && (
        <SettingsSlider
          label={t(m.scanningInterval)}
          value={intervalMs}
          onChange={setScanIntervalMs}
          min={SCAN_INTERVAL_MS.min}
          max={SCAN_INTERVAL_MS.max}
          step={100}
          formatValue={(value) => secondsFormat.format(value / MS_PER_SECOND)}
        />
      )}
    </>
  );
}
