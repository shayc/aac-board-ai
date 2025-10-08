import Box from "@mui/material/Box";

export interface PictogramProps {
  src?: string;
  label?: string;
}

export function Pictogram(props: PictogramProps) {
  const { src, label } = props;

  return (
    <Box>
      <Box>{src && <img src={src} alt="" />}</Box>
      {label && <Box>{label}</Box>}
    </Box>
  );
}
