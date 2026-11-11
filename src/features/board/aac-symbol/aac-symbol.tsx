import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import visuallyHidden from "@mui/utils/visuallyHidden";

export type SymbolLabelPlacement = "top" | "bottom";

interface AACSymbolProps {
  imageSrc?: string;
  label: string;
  labelPlacement?: SymbolLabelPlacement;
  isLabelHidden?: boolean;
  isImageHidden?: boolean;
}

export function AACSymbol({
  imageSrc,
  label,
  labelPlacement = "bottom",
  isLabelHidden = false,
  isImageHidden = false,
}: AACSymbolProps) {
  const hasLabel = label.trim() !== "";
  const isImageShown = Boolean(imageSrc) && !(isImageHidden && hasLabel);
  const isLabelShown = !(isLabelHidden && isImageShown);

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
      {isImageShown && (
        <Box
          component="span"
          sx={{
            position: "relative",
            flexGrow: 1,
            height: "54px",
            aspectRatio: "1 / 1",
            // Symbols are drawn for light backgrounds. A dark contrast theme
            // forces the tile behind them to black, so the symbol keeps a
            // light backing of its own there.
            "@media (forced-colors: active)": {
              backgroundColor: "#fff",
              forcedColorAdjust: "none",
            },
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
      <Typography
        component="span"
        noWrap
        variant={isImageShown ? "body2" : "h5"}
        sx={[
          { lineHeight: 1.2, fontWeight: "fontWeightBold" },
          !isLabelShown && visuallyHidden,
        ]}
      >
        {label}
      </Typography>
    </Box>
  );
}
