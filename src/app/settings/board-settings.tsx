import {
  setTileBordersVisible,
  setTileLabelPlacement,
  setTileSaturation,
  TILE_SATURATION,
  TileLabelPlacementPreview,
  useBoardAppearanceConfig,
  type TileLabelPlacement,
} from "@features/board";
import { buttonBaseClasses } from "@mui/material/ButtonBase";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { SettingsSlider } from "./settings-slider";
import { SettingsSwitch } from "./settings-switch";

function formatSaturation(value: number): string {
  return `${Math.round(value * 100)}%`;
}

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
            <TileLabelPlacementPreview placement={placement} selected />
          }
          icon={<TileLabelPlacementPreview placement={placement} />}
          disableRipple
          sx={{
            p: 0.5,
            borderRadius: 4,
            [`&.${buttonBaseClasses.focusVisible}`]: {
              outline: "3px solid",
              outlineColor: "primary.main",
              outlineOffset: 1,
            },
          }}
        />
      }
      label={label}
      labelPlacement="bottom"
      sx={{ flex: 1, gap: 0.25, m: 0 }}
    />
  );
}

export function BoardSettings() {
  const t = useTranslate();
  const { tileSaturation, areTileBordersVisible, tileLabelPlacement } =
    useBoardAppearanceConfig();

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
          sx={{ flexWrap: "nowrap", gap: 1, mt: 1 }}
        >
          <LabelPlacementOption label={t(m.tileLabelTop)} placement="top" />
          <LabelPlacementOption
            label={t(m.tileLabelBottom)}
            placement="bottom"
          />
          <LabelPlacementOption
            label={t(m.tileLabelHidden)}
            placement="hidden"
          />
        </RadioGroup>
      </FormControl>

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
        formatValue={formatSaturation}
      />
    </Stack>
  );
}
