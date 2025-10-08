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
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ flexGrow: 1, position: "relative" }}>
        {src && (
          <Box
            component="img"
            src={src}
            alt=""
            sx={{ objectFit: "contain", width: "100%", height: "100%" }}
          />
        )}
      </Box>
      {label && <Box>{label}</Box>}
    </Box>
  );
}
