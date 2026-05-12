import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function ErrorState({
  title = "Something went wrong",
  description,
  icon = <ErrorOutlineIcon />,
  action,
}: ErrorStateProps) {
  return (
    <Stack
      spacing={1}
      sx={{
        py: 8,
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      {icon && (
        <Box sx={{ color: "error.main", "& svg": { fontSize: 64, mb: 1 } }}>
          {icon}
        </Box>
      )}

      <Typography variant="h6" color="error.main">
        {title}
      </Typography>

      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: "sm" }}
        >
          {description}
        </Typography>
      )}

      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Stack>
  );
}
