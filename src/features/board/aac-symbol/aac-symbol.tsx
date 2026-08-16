import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import visuallyHidden from "@mui/utils/visuallyHidden";
import type { TileLabelPlacement } from "../appearance/appearance-store";

interface AACSymbolProps {
  imageSrc?: string;
  label: string;
  labelPlacement?: TileLabelPlacement;
}

export function AACSymbol({
  imageSrc,
  label,
  labelPlacement = "bottom",
}: AACSymbolProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: labelPlacement === "top" ? "column-reverse" : "column",
        textAlign: "center",
        justifyContent: "center",
        gap: 0.5,
        overflow: "hidden",
      }}
    >
      {imageSrc && (
        <Box
          sx={{
            height: "54px",
            aspectRatio: "1 / 1",
            flexGrow: 1,
            position: "relative",
          }}
        >
          <Box
            component="img"
            src={imageSrc}
            alt=""
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              position: "absolute",
              top: 0,
              insetInlineStart: 0,
              pointerEvents: "none",
            }}
          />
        </Box>
      )}

      <Typography
        noWrap
        component="span"
        variant={imageSrc ? "body2" : "h5"}
        sx={labelPlacement === "hidden" ? visuallyHidden : { lineHeight: 1 }}
      >
        {label}
      </Typography>
    </Box>
  );
}
