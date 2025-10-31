import Box from "@mui/material/Box";
import type { TypographyVariant } from "@mui/material/styles";
import Typography from "@mui/material/Typography";

export interface PictogramProps {
  src?: string;
  label?: string;
  labelTypographyVariant?: TypographyVariant;
}

export function Pictogram(props: PictogramProps) {
  const { src, label, labelTypographyVariant = "body2" } = props;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        textAlign: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {src && (
        <Box sx={{ flexGrow: 1, position: "relative", minWidth: "44px" }}>
          <Box
            component="img"
            src={src}
            alt=""
            sx={{
              pointerEvents: "none",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />
        </Box>
      )}

      {label && (
        <Typography
          noWrap
          variant={labelTypographyVariant}
          component="span"
          sx={{
            px: 1,
          }}
        >
          {label}
        </Typography>
      )}
    </Box>
  );
}
