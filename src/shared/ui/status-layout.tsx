import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export interface StatusLayoutProps {
  kind: "empty" | "error";
  icon?: ReactNode;
  title: string;
  titleComponent?: "h1" | "p";
  description?: string;
  action?: ReactNode;
}

export function StatusLayout({
  kind,
  icon,
  title,
  titleComponent = "p",
  description,
  action,
}: StatusLayoutProps) {
  const iconColor = kind === "error" ? "error.main" : "text.disabled";

  return (
    <Stack
      sx={{
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 2,
        px: 2,
        py: 8,
        textAlign: "center",
      }}
    >
      {Boolean(icon) && (
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
        <Typography
          component={titleComponent}
          variant="h5"
          sx={{ fontWeight: "fontWeightBold" }}
        >
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

      {Boolean(action) && <Box>{action}</Box>}
    </Stack>
  );
}
