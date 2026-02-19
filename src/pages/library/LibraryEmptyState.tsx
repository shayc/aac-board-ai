import Typography from "@mui/material/Typography";

export function LibraryEmptyState() {
  return (
    <Typography
      variant="body1"
      color="text.secondary"
      sx={{ textAlign: "center", py: 8 }}
    >
      No board sets imported yet. Click &ldquo;Import&rdquo; to add one.
    </Typography>
  );
}
