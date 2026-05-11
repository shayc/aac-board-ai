import Typography from "@mui/material/Typography";

export interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <Typography
      variant="body1"
      color="text.secondary"
      sx={{ textAlign: "center", py: 8 }}
    >
      {message}
    </Typography>
  );
}
