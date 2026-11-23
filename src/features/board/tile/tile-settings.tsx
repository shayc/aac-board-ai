import Box from "@mui/material/Box";
import { buttonBaseClasses } from "@mui/material/ButtonBase";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import Stack from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useUILocale } from "@shared/language/language-store";
import { useTranslate } from "@shared/language/use-translate";
import { ImageIcon } from "@shared/ui/icons";
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
  type TileLabelPlacement,
  useTilePreferences,
} from "./tile-preferences-store";

// Ten steps each, so the sliders feel alike despite their different ranges.
const BRIGHTNESS_STEP = 0.03;
const SATURATION_STEP = 0.1;

export function TileSettings() {
  const t = useTranslate();
  const uiLocale = useUILocale();
  const { saturation, brightness, areBordersVisible, labelPlacement } =
    useTilePreferences();

  const percentFormat = new Intl.NumberFormat(uiLocale, { style: "percent" });

  return (
    <Stack spacing={3}>
      <SettingsRadioGroup
        label={t(m.tileLabelPlacement)}
        value={labelPlacement}
        onChange={setTileLabelPlacement}
        options={[
          { value: "top", label: t(m.tileLabelTop) },
          { value: "bottom", label: t(m.tileLabelBottom) },
          { value: "hidden", label: t(m.tileLabelHidden) },
        ]}
        renderOption={({ value, label }) => (
          <LabelPlacementOption label={label} placement={value} />
        )}
        optionsSx={{ flexWrap: "nowrap", gap: 1, mt: 0.5 }}
      />

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
        formatValue={(value) => percentFormat.format(value)}
      />

      <SettingsSlider
        label={t(m.tileSaturation)}
        value={saturation}
        onChange={setTileSaturation}
        min={TILE_SATURATION.min}
        max={TILE_SATURATION.max}
        step={SATURATION_STEP}
        formatValue={(value) => percentFormat.format(value)}
      />
    </Stack>
  );
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
            <LabelPlacementPreview placement={placement} isSelected />
          }
          icon={<LabelPlacementPreview placement={placement} />}
          sx={radioSx}
        />
      }
      label={label}
      labelPlacement="bottom"
      sx={{ flex: 1, gap: 0.25, m: 0, textAlign: "center" }}
    />
  );
}

interface LabelPlacementPreviewProps {
  placement: TileLabelPlacement;
  isSelected?: boolean;
}

function LabelPlacementPreview({
  placement,
  isSelected = false,
}: LabelPlacementPreviewProps) {
  const isLabelVisible = placement !== "hidden";
  const iconSize = isLabelVisible ? 34 : 42;

  return (
    <Box
      aria-hidden
      component="span"
      sx={(theme) => ({
        display: "block",
        width: 64,
        height: 54,
        p: 0.5,
        border: 2,
        borderColor: isSelected ? "primary.main" : "divider",
        borderRadius: theme.vars.shape.borderRadiusSm,
        color: isSelected ? "primary.main" : "text.secondary",
        bgcolor: isSelected ? "action.selected" : "background.paper",
        // MUI rings a focused radio's first SVG, here the preview's picture.
        // The preview takes the ring instead, so it follows the border.
        [`.${buttonBaseClasses.focusVisible} > &`]: {
          ...theme.focusVisible,
          "& svg:first-of-type": {
            borderRadius: 0,
            outline: "none",
            boxShadow: "none",
          },
        },
      })}
    >
      <Box
        component="span"
        sx={{
          display: "flex",
          flexDirection: placement === "top" ? "column-reverse" : "column",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        <ImageIcon
          sx={{
            alignSelf: "center",
            flexShrink: 0,
            width: iconSize,
            height: iconSize,
          }}
        />

        {isLabelVisible && (
          <Box
            component="span"
            sx={{
              alignSelf: "center",
              flexShrink: 0,
              width: "33.3%",
              height: 3,
              bgcolor: "currentColor",
            }}
          />
        )}
      </Box>
    </Box>
  );
}

function radioSx(theme: Theme) {
  return {
    p: 0.5,
    // Concentric with the preview's corners across the padding, so the hover
    // and ripple halo runs parallel to its border.
    borderRadius: `calc(${theme.vars.shape.borderRadiusSm} + ${theme.spacing(0.5)})`,
  };
}
