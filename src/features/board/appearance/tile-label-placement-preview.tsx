import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import Box from "@mui/material/Box";
import type { TileLabelPlacement } from "./appearance-store";

interface TileLabelPlacementPreviewProps {
  placement: TileLabelPlacement;
  selected?: boolean;
}

export function TileLabelPlacementPreview({
  placement,
  selected = false,
}: TileLabelPlacementPreviewProps) {
  const isLabelVisible = placement !== "hidden";

  return (
    <Box
      aria-hidden="true"
      component="span"
      sx={{
        display: "block",
        width: 64,
        height: 54,
        p: 0.5,
        border: 2,
        borderColor: selected ? "primary.main" : "divider",
        borderRadius: 3,
        color: selected ? "primary.main" : "text.secondary",
        bgcolor: selected ? "action.selected" : "background.paper",
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
            width: isLabelVisible ? 34 : 42,
            height: isLabelVisible ? 34 : 42,
          }}
        />
        {isLabelVisible && (
          <Box
            component="span"
            sx={{
              alignSelf: "center",
              flexShrink: 0,
              width: "33.3%",
              height: 2,
              bgcolor: "currentColor",
            }}
          />
        )}
      </Box>
    </Box>
  );
}
