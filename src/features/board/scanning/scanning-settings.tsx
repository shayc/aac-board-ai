import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import Stack from "@mui/material/Stack";
import { m } from "@paraglide/messages.js";
import { useUILocale } from "@shared/language/language-store";
import { useTranslate } from "@shared/language/use-translate";
import { SettingsRadioGroup } from "@shared/ui/settings-radio-group";
import { SettingsSlider } from "@shared/ui/settings-slider";
import { SettingsSwitch } from "@shared/ui/settings-switch";
import {
  FIRST_ITEM_DELAY,
  REPEAT_PRESS_DELAY,
  SCAN_COUNT,
  SCAN_TIME,
  setFirstItemDelay,
  setRepeatPressDelay,
  setScanCount,
  setScanMethod,
  setScanningEnabled,
  setScanPattern,
  setScanTime,
  useScanningPreferences,
} from "./scanning-preferences-store";

export function ScanningSettings() {
  const t = useTranslate();
  const uiLocale = useUILocale();
  const {
    isEnabled,
    method,
    pattern,
    scanTime,
    firstItemDelay,
    scanCount,
    repeatPressDelay,
  } = useScanningPreferences();

  const secondsFormat = new Intl.NumberFormat(uiLocale, {
    style: "unit",
    unit: "second",
  });
  const countFormat = new Intl.NumberFormat(uiLocale);
  const isAutoScan = method === "auto";

  return (
    <Stack spacing={3}>
      <SettingsSwitch
        label={t(m.scanningEnabled)}
        checked={isEnabled}
        onChange={setScanningEnabled}
      />

      {isEnabled && (
        <>
          <SettingsRadioGroup
            label={t(m.scanningMethod)}
            helperText={
              isAutoScan
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

          <SettingsRadioGroup
            label={t(m.scanningPattern)}
            value={pattern}
            onChange={setScanPattern}
          >
            <FormControlLabel
              value="row-column"
              control={<Radio />}
              label={t(m.scanningPatternRowColumn)}
            />
            <FormControlLabel
              value="linear"
              control={<Radio />}
              label={t(m.scanningPatternLinear)}
            />
          </SettingsRadioGroup>

          {isAutoScan && (
            <>
              <SettingsSlider
                label={t(m.scanningScanTime)}
                value={scanTime}
                onChange={setScanTime}
                min={SCAN_TIME.min}
                max={SCAN_TIME.max}
                step={0.25}
                formatValue={(value) => secondsFormat.format(value)}
              />
              <SettingsSlider
                label={t(m.scanningFirstItemDelay)}
                value={firstItemDelay}
                onChange={setFirstItemDelay}
                min={FIRST_ITEM_DELAY.min}
                max={FIRST_ITEM_DELAY.max}
                step={0.25}
                formatValue={(value) => secondsFormat.format(value)}
              />
              <SettingsSlider
                label={t(m.scanningScanCount)}
                value={scanCount}
                onChange={setScanCount}
                min={SCAN_COUNT.min}
                max={SCAN_COUNT.max}
                step={1}
                formatValue={(value) => countFormat.format(value)}
              />
            </>
          )}

          <SettingsSlider
            label={t(m.scanningRepeatPressDelay)}
            value={repeatPressDelay}
            onChange={setRepeatPressDelay}
            min={REPEAT_PRESS_DELAY.min}
            max={REPEAT_PRESS_DELAY.max}
            step={0.1}
            formatValue={(value) =>
              value === 0 ? t(m.scanningOff) : secondsFormat.format(value)
            }
          />
        </>
      )}
    </Stack>
  );
}
