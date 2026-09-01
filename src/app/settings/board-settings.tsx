import {
  setTileBordersVisible,
  setTileLabelPlacement,
  setTileSaturation,
  TILE_SATURATION,
  type TileLabelPlacement,
  useBoardAppearanceConfig,
} from "@features/board";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
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
  const { tileSaturation, areTileBordersVisible, tileLabelPlacement } =
    useBoardAppearanceConfig();
  const saturationLabel = formatSaturation(tileSaturation);

  return (
    <Stack spacing={3}>
      <FormControl>
        <FormLabel
          id="tile-label-position"
          sx={{ typography: "body2", color: "text.secondary" }}
        >
          {t(m.tileLabelPosition)}
        </FormLabel>
        <RadioGroup
          aria-labelledby="tile-label-position"
          name="tile-label-position"
          value={tileLabelPlacement}
          onChange={(event) =>
            setTileLabelPlacement(event.target.value as TileLabelPlacement)
          }
          row
        >
          <FormControlLabel
            value="top"
            control={<Radio />}
            label={t(m.tileLabelTop)}
          />
          <FormControlLabel
            value="bottom"
            control={<Radio />}
            label={t(m.tileLabelBottom)}
          />
          <FormControlLabel
            value="hidden"
            control={<Radio />}
            label={t(m.tileLabelHidden)}
          />
        </RadioGroup>
      </FormControl>

      <FormControlLabel
        label={t(m.tileBorders)}
        control={
          <Switch
            checked={areTileBordersVisible}
            onChange={(event) => setTileBordersVisible(event.target.checked)}
          />
        }
        labelPlacement="start"
        sx={{ justifyContent: "space-between", m: 0 }}
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
          onChange={(_event, newValue) => setTileSaturation(newValue)}
          min={TILE_SATURATION.min}
          max={TILE_SATURATION.max}
          step={0.1}
        />
      </Stack>
    </Stack>
  );
}
