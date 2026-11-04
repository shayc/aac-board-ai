import CloseIcon from "@mui/icons-material/Close";
import Alert, { alertClasses } from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Snackbar, { type SnackbarCloseReason } from "@mui/material/Snackbar";
import Tooltip from "@mui/material/Tooltip";
import type { Theme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { safeAreaGutter } from "@shared/theme/safe-area";
import { type ReactNode, useRef, useState } from "react";
import {
  SnackbarContext,
  type SnackbarContextValue,
  type SnackbarOptions,
  type SnackbarSeverity,
} from "./snackbar-context";

const DEFAULT_SNACKBAR_SEVERITY: SnackbarSeverity = "info";
const AUTO_HIDE_DURATION_MS = 5000;

interface KeyedSnackbar extends SnackbarOptions {
  key: number;
}

interface SnackbarProviderProps {
  children: ReactNode;
}

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  const t = useTranslate();
  const [current, setCurrent] = useState<KeyedSnackbar>();
  const [isOpen, setIsOpen] = useState(false);
  const nextKeyRef = useRef(0);

  const showSnackbar = (options: SnackbarOptions | string) => {
    const snackbarOptions: SnackbarOptions =
      typeof options === "string" ? { message: options } : options;

    const snackbar: KeyedSnackbar = {
      ...snackbarOptions,
      key: nextKeyRef.current++,
    };

    setCurrent(snackbar);
    setIsOpen(true);
  };

  const handleClose = (
    _event?: React.SyntheticEvent | Event | null,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setIsOpen(false);
  };

  const contextValue: SnackbarContextValue = {
    showSnackbar,
  };

  const message =
    typeof current?.message === "function"
      ? current.message(t)
      : current?.message;
  const severity = current?.severity ?? DEFAULT_SNACKBAR_SEVERITY;
  const isError = severity === "error";
  const action = (
    <>
      {current?.action}
      <Tooltip title={t(m.close)}>
        <IconButton
          aria-label={t(m.close)}
          size="large"
          color="inherit"
          onClick={() => handleClose()}
          sx={(theme) => ({
            "--IconButton-hoverBg": `color-mix(in srgb, currentColor calc(${theme.vars.palette.action.hoverOpacity} * 100%), transparent)`,
          })}
        >
          <CloseIcon />
        </IconButton>
      </Tooltip>
    </>
  );

  return (
    <SnackbarContext value={contextValue}>
      {children}

      <Snackbar
        key={current?.key}
        open={isOpen}
        onClose={handleClose}
        autoHideDuration={current && autoHideDurationMs(current)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={snackbarPlacementStyles}
      >
        <Alert
          role={isError ? "alert" : "status"}
          action={action}
          severity={severity}
          variant={isError ? "filled" : "standard"}
          sx={[
            (theme) => ({
              alignItems: "center",
              width: "100%",
              ...theme.mixins.toolbar,
              paddingBlock: { xs: 0.5, sm: 1 },
              paddingInlineStart: 3,
              paddingInlineEnd: 1,
              ...theme.typography.body1,
              boxShadow: theme.vars.shadows[6],
              [`& .${alertClasses.icon}`]: {
                marginInlineEnd: 2,
                paddingBlock: 0,
                fontSize: 24,
              },
              [`& .${alertClasses.message}`]: {
                paddingBlock: 1,
              },
              [`& .${alertClasses.action}`]: {
                alignItems: "center",
                gap: 1,
                marginInlineEnd: 0,
                paddingBlock: 0,
                paddingInlineStart: 2,
              },
            }),
            !isError && inverseSurfaceStyles(severity),
          ]}
        >
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext>
  );
}

function snackbarPlacementStyles(theme: Theme) {
  return {
    [theme.breakpoints.down("sm")]: {
      top: safeAreaGutter(theme.spacing(1), "top"),
      right: safeAreaGutter(theme.spacing(2), "right"),
      left: safeAreaGutter(theme.spacing(2), "left"),
    },
    [theme.breakpoints.up("sm")]: {
      top: safeAreaGutter(theme.spacing(1), "top"),
    },
  };
}

function inverseSurfaceStyles(severity: Exclude<SnackbarSeverity, "error">) {
  return (theme: Theme) => ({
    color: theme.vars.palette.SnackbarContent.color,
    backgroundColor: theme.vars.palette.SnackbarContent.bg,
    [`& .${alertClasses.icon}`]: {
      color: theme.vars.palette.SnackbarContent[`${severity}IconColor`],
    },
  });
}

function autoHideDurationMs({
  durationMs,
  severity,
  action,
}: SnackbarOptions): number | null {
  if (durationMs !== undefined) {
    return durationMs;
  }

  if (severity === "error" || action) {
    return null;
  }

  return AUTO_HIDE_DURATION_MS;
}
