import Box from "@mui/material/Box";
import { TILE_LENS_ANCHOR } from "./tile";

const LENS_INSET = 6;

// One ring that glides between the hovered or focused tile, via CSS anchor
// positioning. The eye can follow it as it moves, which helps keyboard and
// switch-scanning users more than a ring that jumps. Without anchor support
// it stays hidden and tiles keep their own focus outline.
export function TileFocusLens() {
  return (
    <Box
      aria-hidden
      sx={(theme) => ({
        display: "none",
        "@supports (anchor-name: --a)": {
          display: "block",
          position: "fixed",
          positionAnchor: TILE_LENS_ANCHOR,
          positionVisibility: "anchors-visible",
          zIndex: 1,
          top: `calc(anchor(top) - ${LENS_INSET}px)`,
          left: `calc(anchor(left) - ${LENS_INSET}px)`,
          width: `calc(anchor-size(width) + ${LENS_INSET * 2}px)`,
          height: `calc(anchor-size(height) + ${LENS_INSET * 2}px)`,
          border: `3px solid ${(theme.vars ?? theme).palette.primary.main}`,
          borderRadius: "36px",
          cornerShape: "squircle",
          boxShadow: `0 0 0 6px ${theme.alpha((theme.vars ?? theme).palette.primary.main, 0.18)}`,
          pointerEvents: "none",
          transition: theme.transitions.create(
            ["top", "left", "width", "height"],
            {
              duration: 220,
              easing: "cubic-bezier(0.2, 0.9, 0.3, 1.2)",
            },
          ),
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
          },
        },
      })}
    />
  );
}
