import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import visuallyHidden from "@mui/utils/visuallyHidden";
import type { MediaSource } from "@shared/media/media-source";
import { createImageRef } from "@shared/media/image-ref";
import type { TileLabelPlacement } from "../appearance/appearance-store";
import { SymbolLayout } from "./symbol-layout";

interface AACSymbolProps {
  image?: MediaSource;
  label: string;
  labelPlacement?: TileLabelPlacement;
}

export function AACSymbol({
  image,
  label,
  labelPlacement = "bottom",
}: AACSymbolProps) {
  return (
    <SymbolLayout
      image={
        image ? (
          <Box
            sx={{
              position: "relative",
              flexGrow: 1,
              height: "54px",
              aspectRatio: "1 / 1",
            }}
          >
            <Box
              ref={createImageRef(image)}
              component="img"
              alt=""
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
          component="span"
          noWrap
          variant={image ? "body2" : "h5"}
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
