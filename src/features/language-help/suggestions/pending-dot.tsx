import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";

interface PendingDotProps {
  isVisible: boolean;
}

export function PendingDot({ isVisible }: PendingDotProps) {
  return (
    <Fade
      in={isVisible}
      style={{ transitionDelay: isVisible ? "300ms" : "0ms" }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: 8,
          aspectRatio: "1",
          borderRadius: "50%",
          bgcolor: "warning.main",
        }}
      />
    </Fade>
  );
}
