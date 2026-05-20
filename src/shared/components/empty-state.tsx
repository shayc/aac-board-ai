import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <Stack
      sx={{
        py: 8,
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 2,
      }}
    >
      {icon && (
        <Box
          sx={{
            width: 64,
            height: 64,
            color: "text.disabled",
            "& svg": { fontSize: 64 },
          }}
        >
          {icon}
        </Box>
      )}

      <Box sx={{ my: 1 }}>
        <Typography variant="h5">{title}</Typography>

        {description && (
          <Typography
            variant="body1"
            sx={{ maxWidth: "sm", color: "text.secondary" }}
          >
            {description}
          </Typography>
        )}
      </Box>

      {action && <Box>{action}</Box>}
    </Stack>
  );
}
