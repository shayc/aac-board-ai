import { buttonBaseClasses } from "@mui/material/ButtonBase";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { SettingsSlider } from "@shared/ui/settings-slider";
import { SettingsSwitch } from "@shared/ui/settings-switch";
import { useId } from "react";
import {
  setTileBordersVisible,
  setTileLabelPlacement,
  setTileSaturation,
  TILE_SATURATION,
  useBoardAppearanceConfig,
  type TileLabelPlacement,
} from "./appearance/appearance-store";
import { LabelPlacementPreview } from "./appearance/label-placement-preview";
import {
  setMessagePartHighlightingEnabled,
  useBoardPlaybackConfig,
} from "./playback/playback-config-store";

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
          checkedIcon={<LabelPlacementPreview placement={placement} selected />}
          icon={<LabelPlacementPreview placement={placement} />}
          disableRipple
          sx={(theme) => ({
            p: 0.5,
            borderRadius: 4,
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
  const labelPlacementId = useId();
  const { tileSaturation, areTileBordersVisible, tileLabelPlacement } =
    useBoardAppearanceConfig();
  const { isMessagePartHighlightingEnabled } = useBoardPlaybackConfig();

  return (
    <Stack spacing={3}>
      <FormControl>
        <FormLabel
          id={labelPlacementId}
          sx={{ typography: "body2", color: "text.secondary" }}
        >
          {t(m.tileLabelPosition)}
        </FormLabel>
        <RadioGroup
          aria-labelledby={labelPlacementId}
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

      <SettingsSwitch
        label={t(m.playbackHighlight)}
        checked={isMessagePartHighlightingEnabled}
        onChange={setMessagePartHighlightingEnabled}
      />
    </Stack>
  );
}
