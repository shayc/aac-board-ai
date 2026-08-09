import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import {
  CYCLES_BEFORE_PAUSING,
  FIRST_ITEM_PAUSE_MS,
  IGNORE_REPEAT_MS,
  MINIMUM_PRESS_DURATION_MS,
  setCyclesBeforePausing,
  setFirstItemPauseMs,
  setIgnoreRepeatMs,
  setMinimumPressDurationMs,
} from "@shared/switch-scanning/switch-scanning-store";
import { SettingSlider } from "../setting-slider";

const MILLISECONDS_PER_SECOND = 1_000;

interface SwitchScanningAdvancedSettingsProps {
  cyclesBeforePausing: number;
  firstItemPauseMs: number;
  hasTimedScan: boolean;
  ignoreRepeatMs: number;
  minimumPressDurationMs: number;
  formatSeconds: (value: number) => string;
}

export function SwitchScanningAdvancedSettings({
  cyclesBeforePausing,
  firstItemPauseMs,
  hasTimedScan,
  ignoreRepeatMs,
  minimumPressDurationMs,
  formatSeconds,
}: SwitchScanningAdvancedSettingsProps) {
  const t = useTranslate();

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        borderBlock: 1,
        borderColor: "divider",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="switch-scanning-advanced-controls"
        id="switch-scanning-advanced-heading"
        sx={{ px: 0 }}
      >
        <Typography component="h4" variant="body2" sx={{ fontWeight: 500 }}>
          {t(m.switchScanningAdvanced)}
        </Typography>
      </AccordionSummary>
      <AccordionDetails
        id="switch-scanning-advanced-controls"
        aria-labelledby="switch-scanning-advanced-heading"
        sx={{ px: 0, pt: 1 }}
      >
        <Stack spacing={3}>
          {hasTimedScan && (
            <>
              <SettingSlider
                label={t(m.switchScanningCyclesBeforePausing)}
                value={cyclesBeforePausing}
                min={CYCLES_BEFORE_PAUSING.min}
                max={CYCLES_BEFORE_PAUSING.max}
                step={1}
                formatValue={String}
                onChange={setCyclesBeforePausing}
              />
              <SettingSlider
                label={t(m.switchScanningFirstItemPause)}
                value={firstItemPauseMs / MILLISECONDS_PER_SECOND}
                min={FIRST_ITEM_PAUSE_MS.min / MILLISECONDS_PER_SECOND}
                max={FIRST_ITEM_PAUSE_MS.max / MILLISECONDS_PER_SECOND}
                step={0.1}
                formatValue={formatSeconds}
                onChange={(value) =>
                  setFirstItemPauseMs(value * MILLISECONDS_PER_SECOND)
                }
              />
            </>
          )}
          <SettingSlider
            label={t(m.switchScanningIgnoreRepeatedPresses)}
            value={ignoreRepeatMs / MILLISECONDS_PER_SECOND}
            min={IGNORE_REPEAT_MS.min / MILLISECONDS_PER_SECOND}
            max={IGNORE_REPEAT_MS.max / MILLISECONDS_PER_SECOND}
            step={0.1}
            formatValue={formatSeconds}
            onChange={(value) =>
              setIgnoreRepeatMs(value * MILLISECONDS_PER_SECOND)
            }
          />
          <SettingSlider
            label={t(m.switchScanningMinimumPressDuration)}
            value={minimumPressDurationMs / MILLISECONDS_PER_SECOND}
            min={MINIMUM_PRESS_DURATION_MS.min / MILLISECONDS_PER_SECOND}
            max={MINIMUM_PRESS_DURATION_MS.max / MILLISECONDS_PER_SECOND}
            step={0.1}
            formatValue={formatSeconds}
            onChange={(value) =>
              setMinimumPressDurationMs(value * MILLISECONDS_PER_SECOND)
            }
          />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
