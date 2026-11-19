import Box from "@mui/material/Box";
import { buttonBaseClasses } from "@mui/material/ButtonBase";
import ImageIcon from "@phosphor-icons/core/bold/image-bold.svg?react";
import { PhosphorIcon } from "@shared/ui/phosphor-icon";
import type { TileLabelPlacement } from "./tile-preferences-store";

interface LabelPlacementPreviewProps {
  placement: TileLabelPlacement;
  isSelected?: boolean;
}

export function LabelPlacementPreview({
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
        <PhosphorIcon
          icon={ImageIcon}
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
