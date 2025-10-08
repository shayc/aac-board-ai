import Box from "@mui/material/Box";

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
        width: "100%",
      }}
    >
      <Box sx={{ flexGrow: 1, position: "relative" }}>
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
      {label && <Box>{label}</Box>}
    </Box>
  );
}
