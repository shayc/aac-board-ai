import BrightnessHighIcon from "@mui/icons-material/BrightnessHigh";
import BrightnessLowIcon from "@mui/icons-material/BrightnessLow";
import { buttonBaseClasses } from "@mui/material/ButtonBase";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import Stack from "@mui/material/Stack";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { SettingsRadioGroup } from "@shared/ui/settings-radio-group";
import { SettingsSlider } from "@shared/ui/settings-slider";
import { SettingsSwitch } from "@shared/ui/settings-switch";
import {
  setTileBordersVisible,
  setTileBrightness,
  setTileLabelPlacement,
  setTileSaturation,
  TILE_BRIGHTNESS,
  TILE_SATURATION,
  useBoardPreferences,
} from "./board-preferences-store";
import type { SymbolLabelPlacement } from "./board-types";
import {
  setPlaybackHighlightingEnabled,
  usePlaybackPreferences,
} from "./playback/playback-preferences-store";
import { LabelPlacementPreview } from "./tile/label-placement-preview";

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatBrightnessPosition(value: number): string {
  const { min, max } = TILE_BRIGHTNESS;
  return formatPercent((value - min) / (max - min));
}

interface LabelPlacementOptionProps {
  label: string;
  placement: SymbolLabelPlacement;
}

function LabelPlacementOption({ label, placement }: LabelPlacementOptionProps) {
  return (
    <FormControlLabel
      value={placement}
      control={
        <Radio
          checkedIcon={
            <LabelPlacementPreview placement={placement} isSelected />
          }
          icon={<LabelPlacementPreview placement={placement} />}
          disableRipple
          sx={(theme) => ({
            p: 0.5,
            borderRadius: (theme.vars ?? theme).shape.borderRadius,
            [`&.${buttonBaseClasses.focusVisible}`]: {
              ...theme.focusVisible,
              // MUI's radio ring targets nested SVGs; the preview uses this outer ring.
              "& svg:first-of-type": {
                borderRadius: 0,
                outline: "none",
                boxShadow: "none",
              },
            },
          })}
        />
      }
      label={label}
      labelPlacement="bottom"
      sx={{ flex: 1, gap: 0.25, m: 0, textAlign: "center" }}
    />
  );
}

export function BoardSettings() {
  const t = useTranslate();
  const {
    tileSaturation,
    tileBrightness,
    areTileBordersVisible,
    tileLabelPlacement,
  } = useBoardPreferences();
  const { isHighlightingEnabled } = usePlaybackPreferences();

  return (
    <Stack spacing={3}>
      <SettingsRadioGroup
        label={t(m.tileLabelPlacement)}
        value={tileLabelPlacement}
        onChange={setTileLabelPlacement}
        optionsSx={{ flexWrap: "nowrap", gap: 1, mt: 1 }}
      >
        <LabelPlacementOption label={t(m.tileLabelTop)} placement="top" />
        <LabelPlacementOption label={t(m.tileLabelBottom)} placement="bottom" />
        <LabelPlacementOption label={t(m.tileLabelHidden)} placement="hidden" />
      </SettingsRadioGroup>

      <SettingsSwitch
        label={t(m.tileBorders)}
        checked={areTileBordersVisible}
        onChange={setTileBordersVisible}
      />

      <SettingsSlider
        label={t(m.tileSaturation)}
        value={tileSaturation}
        onChange={setTileSaturation}
        min={TILE_SATURATION.min}
        max={TILE_SATURATION.max}
        step={0.1}
        formatValue={formatPercent}
      />

      <SettingsSlider
        label={t(m.tileBrightness)}
        value={tileBrightness}
        onChange={setTileBrightness}
        min={TILE_BRIGHTNESS.min}
        max={TILE_BRIGHTNESS.max}
        step={0.01}
        formatValue={formatBrightnessPosition}
        isValueVisible={false}
        startIcon={<BrightnessLowIcon fontSize="small" />}
        endIcon={<BrightnessHighIcon />}
      />

      <SettingsSwitch
        label={t(m.playbackHighlight)}
        checked={isHighlightingEnabled}
        onChange={setPlaybackHighlightingEnabled}
      />
    </Stack>
  );
}
