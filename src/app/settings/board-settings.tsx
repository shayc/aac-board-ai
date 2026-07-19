import FormControlLabel from "@mui/material/FormControlLabel";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import {
  setTileBorderVisible,
  setTileSaturation,
  TILE_SATURATION,
  useTileColorConfig,
} from "@shared/tile-color/tile-color-store";

function formatSaturation(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function BoardSettings() {
  const { saturation, borderVisible } = useTileColorConfig();
  const saturationLabel = formatSaturation(saturation);

  return (
    <Stack spacing={3}>
      <FormControlLabel
        labelPlacement="start"
        label={m.tileBorders()}
        sx={{ justifyContent: "space-between", m: 0 }}
        control={
          <Switch
            checked={borderVisible}
            onChange={(event) => setTileBorderVisible(event.target.checked)}
          />
        }
      />

      <Stack spacing={0.5}>
        <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {m.tileSaturation()}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {saturationLabel}
          </Typography>
        </Stack>
        <Slider
          aria-label={m.tileSaturation()}
          getAriaValueText={formatSaturation}
          value={saturation}
          min={TILE_SATURATION.min}
          max={TILE_SATURATION.max}
          step={0.1}
          onChange={(_event, newValue) => setTileSaturation(newValue)}
        />
      </Stack>
    </Stack>
  );
}
