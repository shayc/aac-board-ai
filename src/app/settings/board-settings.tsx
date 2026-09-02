import {
  setTileBordersVisible,
  setTileLabelPlacement,
  setTileSaturation,
  TILE_SATURATION,
  type TileLabelPlacement,
  useBoardAppearanceConfig,
} from "@features/board";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import Box from "@mui/material/Box";
import { buttonBaseClasses } from "@mui/material/ButtonBase";
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

function LabelLine() {
  return (
    <Box
      component="span"
      sx={{
        flexShrink: 0,
        width: "60%",
        height: 3,
        borderRadius: 1,
        bgcolor: "currentColor",
      }}
    />
  );
}

interface LabelPlacementPreviewProps {
  placement: TileLabelPlacement;
  selected?: boolean;
}

function LabelPlacementPreview({
  placement,
  selected = false,
}: LabelPlacementPreviewProps) {
  return (
    <Box
      aria-hidden="true"
      component="span"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: 64,
        height: 54,
        p: 0.5,
        gap: 0.25,
        border: 2,
        borderColor: selected ? "primary.main" : "divider",
        borderRadius: 3,
        color: selected ? "primary.main" : "text.secondary",
        bgcolor: selected ? "action.selected" : "background.paper",
      }}
    >
      {placement === "top" && <LabelLine />}
      <ImageOutlinedIcon
        sx={{
          flexShrink: 0,
          width: placement === "hidden" ? 42 : 34,
          height: placement === "hidden" ? 42 : 34,
        }}
      />
      {placement === "bottom" && <LabelLine />}
    </Box>
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
          checkedIcon={<LabelPlacementPreview placement={placement} selected />}
          icon={<LabelPlacementPreview placement={placement} />}
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
          row
          onChange={(event) =>
            setTileLabelPlacement(event.target.value as TileLabelPlacement)
          }
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
