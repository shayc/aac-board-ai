import { buttonBaseClasses } from "@mui/material/ButtonBase";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import Stack from "@mui/material/Stack";
import { m } from "@paraglide/messages.js";
import { usePerfSpan } from "@perf";
import { useLanguage } from "@shared/language/use-language";
import { useTranslate } from "@shared/language/use-translate";
import { SettingsRadioGroup } from "@shared/ui/settings-radio-group";
import { SettingsSlider } from "@shared/ui/settings-slider";
import { SettingsSwitch } from "@shared/ui/settings-switch";
import {
  setTileBordersVisible,
  setTileLabelPlacement,
  setTileSaturation,
  TILE_SATURATION,
  useBoardPreferences,
} from "./board-preferences-store";
import type { SymbolLabelPlacement } from "./aac-symbol/aac-symbol";
import { LabelPlacementPreview } from "./tile/label-placement-preview";

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

export function BoardSettings() {
  const t = useTranslate();
  const { language } = useLanguage();
  const percentFormat = new Intl.NumberFormat(language, { style: "percent" });
  const { tileSaturation, areTileBordersVisible, tileLabelPlacement } =
    useBoardPreferences();
  const labelPlacementSpan = usePerfSpan(
    "flow:settings:label-placement",
    tileLabelPlacement,
  );

  function changeLabelPlacement(placement: SymbolLabelPlacement) {
    labelPlacementSpan.start();
    setTileLabelPlacement(placement);
  }

  return (
    <Stack spacing={3}>
      <SettingsRadioGroup
        label={t(m.tileLabelPlacement)}
        value={tileLabelPlacement}
        onChange={changeLabelPlacement}
        optionsSx={{ flexWrap: "nowrap", gap: 1, mt: 0.5 }}
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
        formatValue={(value) => percentFormat.format(value)}
      />
    </Stack>
  );
}
