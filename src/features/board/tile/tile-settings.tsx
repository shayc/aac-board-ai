import { buttonBaseClasses } from "@mui/material/ButtonBase";
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
  setTileBordersVisible,
  setTileBrightness,
  setTileLabelPlacement,
  setTileSaturation,
  TILE_BRIGHTNESS,
  TILE_SATURATION,
  useTilePreferences,
  type TileLabelPlacement,
} from "./tile-preferences-store";
import { LabelPlacementPreview } from "./label-placement-preview";

// Ten steps each, so the two sliders feel alike though their ranges differ.
const BRIGHTNESS_STEP = 0.03;
const SATURATION_STEP = 0.1;

interface LabelPlacementOptionProps {
  label: string;
  placement: TileLabelPlacement;
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
          sx={(theme) => ({
            p: 0.5,
            borderRadius: theme.vars.shape.borderRadius,
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

export function TileSettings() {
  const t = useTranslate();
  const uiLocale = useUILocale();
  const percentFormat = new Intl.NumberFormat(uiLocale, { style: "percent" });
  const { saturation, brightness, areBordersVisible, labelPlacement } =
    useTilePreferences();

  return (
    <Stack spacing={3}>
      <SettingsRadioGroup
        label={t(m.tileLabelPlacement)}
        value={labelPlacement}
        onChange={setTileLabelPlacement}
        optionsSx={{ flexWrap: "nowrap", gap: 1, mt: 0.5 }}
      >
        <LabelPlacementOption label={t(m.tileLabelTop)} placement="top" />
        <LabelPlacementOption label={t(m.tileLabelBottom)} placement="bottom" />
        <LabelPlacementOption label={t(m.tileLabelHidden)} placement="hidden" />
      </SettingsRadioGroup>

      <SettingsSwitch
        label={t(m.tileBorders)}
        checked={areBordersVisible}
        onChange={setTileBordersVisible}
      />

      <SettingsSlider
        label={t(m.tileBrightness)}
        value={brightness}
        onChange={setTileBrightness}
        min={TILE_BRIGHTNESS.min}
        max={TILE_BRIGHTNESS.max}
        step={BRIGHTNESS_STEP}
        isValueHidden
        formatValue={(value) => percentFormat.format(value)}
      />

      <SettingsSlider
        label={t(m.tileSaturation)}
        value={saturation}
        onChange={setTileSaturation}
        min={TILE_SATURATION.min}
        max={TILE_SATURATION.max}
        step={SATURATION_STEP}
        isValueHidden
        formatValue={(value) => percentFormat.format(value)}
      />
    </Stack>
  );
}
