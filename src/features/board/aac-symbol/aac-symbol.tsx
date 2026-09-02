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
        justifyContent: "center",
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
          { fontWeight: 600, lineHeight: 1 },
          labelPlacement === "hidden" && visuallyHidden,
        ]}
      >
        {label}
      </Typography>
    </Box>
  );
}
