import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

interface LoadingIndicatorProps {
  message?: string;
}

export function LoadingIndicator({ message }: LoadingIndicatorProps) {
  return (
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
  );
}
