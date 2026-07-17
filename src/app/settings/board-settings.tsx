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

export function BoardSettings() {
  const { saturation, borderVisible } = useTileColorConfig();

  return (
    <Stack spacing={3}>
      <FormControlLabel
        label={m.tileBorders()}
        control={
          <Switch
            checked={borderVisible}
            onChange={(event) => setTileBorderVisible(event.target.checked)}
          />
        }
      />

      <Stack spacing={0.5}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {m.tileSaturation()}
        </Typography>
        <Slider
          aria-label={m.tileSaturation()}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
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
