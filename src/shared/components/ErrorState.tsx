import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export interface ErrorStateProps {
  title?: string;
  message?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "Try refreshing the page",
}: ErrorStateProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 2,
        p: 4,
      }}
    >
      <Typography variant="h6" color="error">
        {title}
      </Typography>
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );
}
