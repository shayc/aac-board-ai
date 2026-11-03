import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import visuallyHidden from "@mui/utils/visuallyHidden";
import type { SymbolLabelPlacement } from "../board-types";

interface AACSymbolProps {
  imageSrc?: string;
  label: string;
  labelPlacement?: SymbolLabelPlacement;
}

export function AACSymbol({
  imageSrc,
  label,
  labelPlacement = "bottom",
}: AACSymbolProps) {
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
      {imageSrc && (
        <Box
          sx={{
            position: "relative",
            flexGrow: 1,
            height: "54px",
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
      <Typography
        component="span"
        noWrap
        variant={imageSrc ? "body2" : "h5"}
        sx={[
          { lineHeight: 1.2 },
          Boolean(imageSrc) && { fontWeight: "fontWeightBold" },
          labelPlacement === "hidden" && visuallyHidden,
        ]}
      >
        {label}
      </Typography>
    </Box>
  );
}
