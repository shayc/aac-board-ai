import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

interface ErrorStateProps {
  icon?: ReactNode;
  title: string;
  action?: ReactNode;
}

const defaultIcon = <ErrorOutlineIcon />;

export function ErrorState({
  icon = defaultIcon,
  title,
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
            color: "error.main",
            "& svg": { fontSize: 64 },
          }}
        >
          {icon}
        </Box>
      )}

      <Typography
        component="p"
        variant="h5"
        sx={{ my: 1, fontWeight: "fontWeightBold" }}
      >
        {title}
      </Typography>

      {Boolean(action) && <Box>{action}</Box>}
    </Stack>
  );
}
