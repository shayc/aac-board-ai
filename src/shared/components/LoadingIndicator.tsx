import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Fade from "@mui/material/Fade";
import Typography from "@mui/material/Typography";

interface LoadingIndicatorProps {
  message?: string;
}

export function LoadingIndicator({ message }: LoadingIndicatorProps) {
  return (
    <Fade in timeout={400} style={{ transitionDelay: "500ms" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          marginTop: 4,
        }}
      >
        <CircularProgress />
        {message && <Typography>{message}</Typography>}
      </Box>
    </Fade>
  );
}
