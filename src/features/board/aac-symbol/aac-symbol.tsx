import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import visuallyHidden from "@mui/utils/visuallyHidden";

// A container that knows its own size, such as a tile, sets this to scale the
// label with it.
export const SYMBOL_LABEL_FONT_SIZE_PROPERTY = "--symbol-label-font-size";

export type SymbolLabelPlacement = "top" | "bottom";

interface AACSymbolProps {
  label: string;
  imageSrc?: string;
  labelPlacement?: SymbolLabelPlacement;
  isLabelVisible?: boolean;
  isImageVisible?: boolean;
}

export function AACSymbol({
  label,
  imageSrc,
  labelPlacement = "bottom",
  isLabelVisible = true,
  isImageVisible = true,
}: AACSymbolProps) {
  const hasLabel = label.trim() !== "";
  const isImageDisplayed = Boolean(imageSrc) && (isImageVisible || !hasLabel);
  const isLabelDisplayed = isLabelVisible || !isImageDisplayed;

  return (
    <Box
      component="span"
      sx={{
        display: "flex",
        flexDirection: labelPlacement === "top" ? "column-reverse" : "column",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        gap: 0.5,
        overflow: "hidden",
        textAlign: "center",
      }}
    >
      {isImageDisplayed && (
        <Box
          component="span"
          sx={{
            position: "relative",
            flexGrow: 1,
            height: "54px",
            // Let the image shrink so the label keeps its full line.
            minHeight: 0,
            aspectRatio: "1 / 1",
          }}
        >
          <Box
            component="img"
            alt=""
            src={imageSrc}
            sx={{
              position: "absolute",
              top: 0,
              insetInlineStart: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              pointerEvents: "none",
            }}
          />
        </Box>
      )}

      {hasLabel && (
        <Typography
          component="span"
          noWrap
          variant={isImageDisplayed ? "body2" : "h5"}
          sx={[
            { flexShrink: 0, lineHeight: 1.2, fontWeight: "fontWeightBold" },
            isImageDisplayed &&
              ((theme) => ({
                fontSize: `var(${SYMBOL_LABEL_FONT_SIZE_PROPERTY}, ${theme.typography.body2.fontSize})`,
              })),
            !isLabelDisplayed && visuallyHidden,
          ]}
        >
          {label}
        </Typography>
      )}
    </Box>
  );
}
