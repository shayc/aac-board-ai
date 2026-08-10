import {
  setTileBordersVisible,
  setTileSaturation,
  TILE_SATURATION,
  useBoardAppearanceConfig,
} from "@features/board";
import FormControlLabel from "@mui/material/FormControlLabel";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";

function formatSaturation(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function BoardSettings() {
  const t = useTranslate();
  const { tileSaturation, areTileBordersVisible } = useBoardAppearanceConfig();
  const saturationLabel = formatSaturation(tileSaturation);

  return (
    <Stack spacing={3}>
      <FormControlLabel
        labelPlacement="start"
        label={t(m.tileBorders)}
        sx={{ justifyContent: "space-between", m: 0 }}
        control={
          <Switch
            checked={areTileBordersVisible}
            onChange={(event) => setTileBordersVisible(event.target.checked)}
          />
        }
      />

      <Stack spacing={0.5}>
        <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t(m.tileSaturation)}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {saturationLabel}
          </Typography>
        </Stack>
        <Slider
          aria-label={t(m.tileSaturation)}
          getAriaValueText={formatSaturation}
          value={tileSaturation}
          min={TILE_SATURATION.min}
          max={TILE_SATURATION.max}
          step={0.1}
          onChange={(_event, newValue) => setTileSaturation(newValue)}
        />
      </Stack>
    </Stack>
  );
}
