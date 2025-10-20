import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export interface PictogramProps {
  src?: string;
  label?: string;
}

export function Pictogram(props: PictogramProps) {
  const { src, label } = props;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      <Box sx={{ flexGrow: 1, position: "relative", minWidth: "44px" }}>
        {src && (
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
              left: 0,
            }}
          />
        )}
      </Box>

      {label && (
        <Typography
          noWrap
          variant="body2"
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
