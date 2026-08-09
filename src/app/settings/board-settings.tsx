import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import {
  setTileBorderVisible,
  setTileSaturation,
  TILE_SATURATION,
  useTileAppearanceConfig,
} from "@shared/tile-appearance/tile-appearance-store";
import { SettingSlider } from "./setting-slider";

function formatSaturation(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function BoardSettings() {
  const t = useTranslate();
  const { saturation, borderVisible } = useTileAppearanceConfig();

  return (
    <Stack spacing={3}>
      <FormControlLabel
        labelPlacement="start"
        label={t(m.tileBorders)}
        sx={{ justifyContent: "space-between", m: 0 }}
        control={
          <Switch
            checked={borderVisible}
            onChange={(event) => setTileBorderVisible(event.target.checked)}
          />
        }
      />

      <SettingSlider
        label={t(m.tileSaturation)}
        value={saturation}
        min={TILE_SATURATION.min}
        max={TILE_SATURATION.max}
        step={0.1}
        formatValue={formatSaturation}
        onChange={setTileSaturation}
      />
    </Stack>
  );
}
