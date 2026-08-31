import Box from "@mui/material/Box";
import { orange } from "@mui/material/colors";
import Fade from "@mui/material/Fade";

interface PendingDotProps {
  show: boolean;
}

export function PendingDot({ show }: PendingDotProps) {
  return (
    <Fade in={show} style={{ transitionDelay: show ? "300ms" : "0ms" }}>
      <Box
        sx={{
          flexShrink: 0,
          width: 8,
          aspectRatio: "1",
          borderRadius: "50%",
          backgroundColor: orange[500],
        }}
      />
    </Fade>
  );
}
