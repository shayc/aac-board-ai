import Alert, { alertClasses } from "@mui/material/Alert";
import Snackbar, { type SnackbarCloseReason } from "@mui/material/Snackbar";
import type { Theme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { safeAreaGutter } from "@shared/theme/safe-area";
import { toolbarOffset } from "@shared/theme/toolbar-offset";
import { type ReactNode, type SyntheticEvent, useReducer, useRef } from "react";
import {
  SnackbarContext,
  type SnackbarContextValue,
  type SnackbarOptions,
  type SnackbarSeverity,
} from "./snackbar-context";

const DEFAULT_SEVERITY: SnackbarSeverity = "info";
const DEFAULT_DURATION_MS = 4000;

interface QueuedSnackbar extends SnackbarOptions {
  key: number;
}

interface SnackbarState {
  queue: readonly QueuedSnackbar[];
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

  function showSnackbar(options: SnackbarOptions | string) {
    const snackbarOptions: SnackbarOptions =
      typeof options === "string" ? { message: options } : options;

    const snackbar: QueuedSnackbar = {
      ...snackbarOptions,
      key: nextKeyRef.current++,
    };

    dispatch({ type: "show", snackbar });
  }

  function handleClose(
    _event?: SyntheticEvent | Event | null,
    reason?: SnackbarCloseReason,
  ) {
    if (reason === "clickaway") {
      return;
    }

    dispatch({ type: "close" });
  }

  function handleExited() {
    dispatch({ type: "exited" });
  }

  const contextValue: SnackbarContextValue = {
    showSnackbar,
  };

  const severity = state.current?.severity ?? DEFAULT_SEVERITY;
  const message =
    typeof state.current?.message === "function"
      ? state.current.message(t)
      : state.current?.message;
  const autoHideDurationMs =
    state.current?.durationMs ?? defaultDurationMs(severity);

  return (
    <SnackbarContext value={contextValue}>
      {children}

      <Snackbar
        key={state.current?.key}
        open={state.open}
        onClose={handleClose}
        autoHideDuration={autoHideDurationMs}
        // Keep persistent errors clear of the board's bottom controls.
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        slotProps={{ transition: { onExited: handleExited } }}
        sx={snackbarSx}
      >
        <Alert
          role={isUrgent(severity) ? "alert" : "status"}
          closeText={t(m.close)}
          action={state.current?.action}
          severity={severity}
          onClose={handleClose}
          sx={(theme) => createAlertSx(theme, severity)}
        >
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext>
  );
}

function isUrgent(severity: SnackbarSeverity) {
  return severity === "error" || severity === "warning";
}

function defaultDurationMs(severity: SnackbarSeverity): number | null {
  return isUrgent(severity) ? null : DEFAULT_DURATION_MS;
}

function snackbarSx(theme: Theme) {
  return {
    // Sitting below the app bar keeps its controls reachable while a
    // persistent error stays on screen.
    ...toolbarOffset(theme, theme.spacing(1)),
    [theme.breakpoints.down("sm")]: {
      right: safeAreaGutter(theme.spacing(1), "right"),
      left: safeAreaGutter(theme.spacing(1), "left"),
    },
  };
}

function createAlertSx(theme: Theme, severity: SnackbarSeverity) {
  return {
    width: "100%",
    color: theme.vars.palette.SnackbarContent.color,
    backgroundColor: theme.vars.palette.SnackbarContent.bg,
    boxShadow: theme.vars.shadows[6],
    // The snackbar surface inverts the color scheme, so its icon takes the
    // other scheme's severity color to keep contrast.
    [`& .${alertClasses.icon}`]: {
      color: theme.colorSchemes.dark?.palette[severity].main,
      ...theme.applyStyles("dark", {
        color: theme.colorSchemes.light?.palette[severity].main,
      }),
    },
  };
}

function snackbarReducer(
  state: SnackbarState,
  action: SnackbarAction,
): SnackbarState {
  switch (action.type) {
    case "show": {
      if (state.current) {
        return {
          ...state,
          queue: [...state.queue, action.snackbar],
          open: false,
        };
      }

      return { ...state, current: action.snackbar, open: true };
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
