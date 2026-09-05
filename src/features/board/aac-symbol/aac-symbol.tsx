import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import visuallyHidden from "@mui/utils/visuallyHidden";
import type { TileLabelPlacement } from "../appearance/appearance-store";
import { SymbolLayout } from "./symbol-layout";

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
    <SymbolLayout
      image={
        imageSrc ? (
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
        ) : undefined
      }
      label={
        <Typography
          component="bdi"
          noWrap
          variant={imageSrc ? "body2" : "h5"}
          sx={[
            { lineHeight: 1 },
            labelPlacement === "hidden" && visuallyHidden,
          ]}
        >
          {label}
        </Typography>
      }
      labelPlacement={labelPlacement}
    />
  );
}
