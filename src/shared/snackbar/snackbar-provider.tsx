import Alert, { alertClasses } from "@mui/material/Alert";
import Snackbar, { type SnackbarCloseReason } from "@mui/material/Snackbar";
import type { Theme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { safeAreaGutter } from "@shared/theme/safe-area";
import { type ReactNode, useReducer, useRef } from "react";
import {
  SnackbarContext,
  type SnackbarContextValue,
  type SnackbarOptions,
  type SnackbarSeverity,
} from "./snackbar-context";

const DEFAULT_SNACKBAR_SEVERITY: SnackbarSeverity = "info";
const DEFAULT_SNACKBAR_DURATION_MS = 5000;

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

  const severity = state.current?.severity ?? DEFAULT_SNACKBAR_SEVERITY;
  const isError = severity === "error";
  const durationMs =
    state.current?.durationMs === undefined
      ? defaultDurationMs(severity)
      : state.current.durationMs;

  const message =
    typeof state.current?.message === "function"
      ? state.current.message(t)
      : state.current?.message;

  return (
    <SnackbarContext value={contextValue}>
      {children}

      <Snackbar
        key={state.current?.key}
        open={state.open}
        onClose={handleClose}
        autoHideDuration={durationMs}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        slotProps={{ transition: { onExited: handleExited } }}
        sx={overAppBar}
      >
        <Alert
          closeText={t(m.close)}
          action={state.current?.action}
          role={isError ? "alert" : "status"}
          severity={severity}
          variant={isError ? "filled" : "standard"}
          onClose={handleClose}
          sx={[
            { width: "100%", boxShadow: 6 },
            isError ? filledErrorSurface : inverseSurface(severity),
          ]}
        >
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext>
  );
}

function filledErrorSurface(theme: Theme) {
  return theme.applyStyles("dark", {
    backgroundColor: theme.vars.palette.error.main,
    color: theme.vars.palette.error.contrastText,
  });
}

function inverseSurface(severity: SnackbarSeverity) {
  return (theme: Theme) => {
    const { light, dark } = theme.colorSchemes;

    return {
      backgroundColor: dark?.palette.background.paper,
      color: dark?.palette.text.primary,
      [`& .${alertClasses.icon}`]: { color: dark?.palette[severity].main },
      ...theme.applyStyles("dark", {
        backgroundColor: light?.palette.background.paper,
        color: light?.palette.text.primary,
        [`& .${alertClasses.icon}`]: { color: light?.palette[severity].main },
      }),
    };
  };
}

function overAppBar(theme: Theme) {
  const top = safeAreaGutter(theme.spacing(1), "top");

  return { top, [theme.breakpoints.up("sm")]: { top } };
}

function defaultDurationMs(severity: SnackbarSeverity): number | null {
  return severity === "error" ? null : DEFAULT_SNACKBAR_DURATION_MS;
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
