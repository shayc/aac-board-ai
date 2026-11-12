import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import Box from "@mui/material/Box";
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
      sx={{
        display: "block",
        width: 64,
        height: 54,
        p: 0.5,
        border: 2,
        borderColor: isSelected ? "primary.main" : "divider",
        borderRadius: (theme) => theme.vars.shape.borderRadiusSm,
        color: isSelected ? "primary.main" : "text.secondary",
        bgcolor: isSelected ? "action.selected" : "background.paper",
      }}
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
        <ImageOutlinedIcon
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
