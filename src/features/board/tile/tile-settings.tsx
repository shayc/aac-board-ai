import { buttonBaseClasses } from "@mui/material/ButtonBase";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import Stack from "@mui/material/Stack";
import { m } from "@paraglide/messages.js";
import { useLanguage } from "@shared/language/use-language";
import { useTranslate } from "@shared/language/use-translate";
import { SettingsRadioGroup } from "@shared/ui/settings-radio-group";
import { SettingsSlider } from "@shared/ui/settings-slider";
import { SettingsSwitch } from "@shared/ui/settings-switch";
import type { LabelPlacement } from "../aac-symbol/aac-symbol";
import {
  setTileBordersVisible,
  setTileLabelPlacement,
  setTileSaturation,
  TILE_SATURATION,
  useTilePreferences,
} from "./tile-preferences-store";
import { LabelPlacementPreview } from "./label-placement-preview";

interface LabelPlacementOptionProps {
  label: string;
  placement: LabelPlacement;
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
  const { language } = useLanguage();
  const percentFormat = new Intl.NumberFormat(language, { style: "percent" });
  const { saturation, areBordersVisible, labelPlacement } =
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
        label={t(m.tileSaturation)}
        value={saturation}
        onChange={setTileSaturation}
        min={TILE_SATURATION.min}
        max={TILE_SATURATION.max}
        step={0.1}
        formatValue={(value) => percentFormat.format(value)}
      />
    </Stack>
  );
}
