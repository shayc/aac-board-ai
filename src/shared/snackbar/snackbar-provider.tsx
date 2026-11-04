import CloseIcon from "@mui/icons-material/Close";
import Alert, { alertClasses } from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Snackbar, { type SnackbarCloseReason } from "@mui/material/Snackbar";
import type { Theme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import {
  ON_ERROR_DARK,
  ON_ERROR_LIGHT,
  STATUS_DARK,
  STATUS_LIGHT,
} from "@shared/theme/theme-colors";
import { type ReactNode, useReducer, useRef } from "react";
import {
  SnackbarContext,
  type SnackbarContextValue,
  type SnackbarOptions,
  type SnackbarSeverity,
} from "./snackbar-context";

const DEFAULT_SNACKBAR_SEVERITY: SnackbarSeverity = "info";
const AUTO_HIDE_DURATION_MS = 5000;

interface QueuedSnackbar extends SnackbarOptions {
  key: number;
}

interface SnackbarState {
  queue: QueuedSnackbar[];
  current: QueuedSnackbar | undefined;
  open: boolean;
}

type SnackbarAction =
  | { type: "show"; snackbar: QueuedSnackbar }
  | { type: "close" }
  | { type: "exited" };

const initialState: SnackbarState = {
  queue: [],
  current: undefined,
  open: false,
};

interface SnackbarProviderProps {
  children: ReactNode;
}

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  const t = useTranslate();
  const [state, dispatch] = useReducer(snackbarReducer, initialState);
  const nextKeyRef = useRef(0);
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  const showSnackbar = (options: SnackbarOptions | string) => {
    const snackbarOptions: SnackbarOptions =
      typeof options === "string" ? { message: options } : options;

    const snackbar: QueuedSnackbar = {
      ...snackbarOptions,
      key: nextKeyRef.current++,
    };

    dispatch({ type: "show", snackbar });
  };

  const handleClose = (
    _event?: React.SyntheticEvent | Event | null,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === "clickaway") {
      return;
    }

    dispatch({ type: "close" });
  };

  const handleExited = () => {
    dispatch({ type: "exited" });
  };

  const contextValue: SnackbarContextValue = {
    showSnackbar,
  };

  const message =
    typeof state.current?.message === "function"
      ? state.current.message(t)
      : state.current?.message;
  const severity = state.current?.severity ?? DEFAULT_SNACKBAR_SEVERITY;
  const action = (
    <>
      {state.current?.action}
      <IconButton
        aria-label={t(m.close)}
        title={t(m.close)}
        color="inherit"
        onClick={() => handleClose()}
        sx={{
          backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)",
          "&:hover": {
            backgroundColor:
              "color-mix(in srgb, currentColor 20%, transparent)",
          },
        }}
      >
        <CloseIcon />
      </IconButton>
    </>
  );

  return (
    <SnackbarContext value={contextValue}>
      {children}

      <Snackbar
        key={state.current?.key}
        open={state.open}
        onClose={handleClose}
        autoHideDuration={state.current && autoHideDurationMs(state.current)}
        anchorOrigin={{
          vertical: isSmallScreen ? "bottom" : "top",
          horizontal: "center",
        }}
        slotProps={{ transition: { onExited: handleExited } }}
      >
        <Alert
          action={action}
          severity={severity}
          variant={severity === "error" ? "filled" : "standard"}
          sx={[
            (theme) => ({
              alignItems: "center",
              width: "100%",
              minHeight: 56,
              paddingBlock: 1,
              paddingInlineStart: 2.5,
              paddingInlineEnd: 1,
              boxShadow: theme.vars.shadows[6],
              [`& .${alertClasses.action}`]: {
                alignItems: "center",
                gap: 1,
                marginInlineEnd: 0,
                paddingBlock: 0,
                paddingInlineStart: 3,
              },
            }),
            severity === "error"
              ? errorSurfaceStyles
              : inverseSurfaceStyles(severity),
          ]}
        >
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext>
  );
}

function errorSurfaceStyles(theme: Theme) {
  return {
    color: ON_ERROR_LIGHT,
    backgroundColor: STATUS_LIGHT.error,
    ...theme.applyStyles("dark", {
      color: ON_ERROR_DARK,
      backgroundColor: STATUS_DARK.error,
    }),
  };
}

function inverseSurfaceStyles(severity: Exclude<SnackbarSeverity, "error">) {
  return (theme: Theme) => ({
    color: theme.vars.palette.SnackbarContent.color,
    backgroundColor: theme.vars.palette.SnackbarContent.bg,
    [`& .${alertClasses.icon}`]: {
      color: STATUS_DARK[severity],
      ...theme.applyStyles("dark", {
        color: STATUS_LIGHT[severity],
      }),
    },
  });
}

function isPersistent(snackbar: SnackbarOptions) {
  return autoHideDurationMs(snackbar) === null;
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

function snackbarReducer(
  state: SnackbarState,
  action: SnackbarAction,
): SnackbarState {
  switch (action.type) {
    case "show": {
      if (!state.current) {
        return { ...state, current: action.snackbar, open: true };
      }

      const queue = [...state.queue, action.snackbar];

      if (isPersistent(state.current)) {
        return { ...state, queue };
      }

      return { ...state, queue, open: false };
    }

    case "close":
      return { ...state, open: false };

    case "exited": {
      if (state.queue.length > 0) {
        return {
          current: state.queue[0],
          queue: state.queue.slice(1),
          open: true,
        };
      }

      return { ...state, current: undefined };
    }
  }
}
