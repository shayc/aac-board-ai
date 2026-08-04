import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export interface StatusLayoutProps {
  kind: "empty" | "error";
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function StatusLayout({
  kind,
  icon,
  title,
  description,
  action,
}: StatusLayoutProps) {
  const iconColor = kind === "error" ? "error.main" : "text.disabled";

  return (
    <Stack
      sx={{
        height: "100%",
        py: 8,
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        textAlign: "center",
      }}
    >
      {icon && (
        <Box
          sx={{
            width: 64,
            height: 64,
            color: iconColor,
            "& svg": { fontSize: 64 },
          }}
        >
          {icon}
        </Box>
      )}

      <Box sx={{ my: 1 }}>
        <Typography component="p" variant="h5" sx={{ fontWeight: "bold" }}>
          {title}
        </Typography>

        {description && (
          <Typography
            component="p"
            variant="subtitle1"
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
