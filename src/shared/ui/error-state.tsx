import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ElementType, ReactNode } from "react";
import { ErrorIcon } from "./icons";

const defaultIcon = <ErrorIcon />;

interface ErrorStateProps {
  icon?: ReactNode;
  title: string;
  titleComponent?: ElementType;
  action?: ReactNode;
}

export function ErrorState({
  icon = defaultIcon,
  title,
  titleComponent = "p",
  action,
}: ErrorStateProps) {
  return (
    <Stack
      sx={{
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 2,
        py: 8,
        textAlign: "center",
      }}
    >
      {Boolean(icon) && (
        <Box
          sx={{
            width: 64,
            height: 64,
            // The title says what went wrong; a red icon alarms more than
            // these states warrant.
            color: "text.secondary",
            "& svg": { fontSize: 64 },
          }}
        >
          {icon}
        </Box>
      )}

      <Typography
        component={titleComponent}
        variant="h5"
        sx={{ my: 1, fontWeight: "fontWeightBold" }}
      >
        {title}
      </Typography>

      {Boolean(action) && <Box>{action}</Box>}
    </Stack>
  );
}
