import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export interface PictogramProps {
  src?: string;
  label?: string;
}

export function Pictogram({ src, label }: PictogramProps) {
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
        <Box sx={{ flexGrow: 1, position: "relative", minWidth: "64px" }}>
          <Box
            component="img"
            src={src}
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

      {label && (
        <Typography component="span" variant={src ? "body2" : "h5"} noWrap>
          {label}
        </Typography>
      )}
    </Box>
  );
}
