import Alert, { alertClasses } from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Snackbar, { type SnackbarCloseReason } from "@mui/material/Snackbar";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { type Translate, useTranslate } from "@shared/language/use-translate";
import { safeAreaGutter } from "@shared/theme/safe-area";
import { type ReactNode, type SyntheticEvent, useReducer, useRef } from "react";
import {
  SnackbarContext,
  type SnackbarContextValue,
  type SnackbarMessage,
  type SnackbarOptions,
  type SnackbarSeverity,
} from "./snackbar-context";

const DEFAULT_SNACKBAR_SEVERITY: SnackbarSeverity = "info";
const DEFAULT_SNACKBAR_DURATION_MS = 4000;

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
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));

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

  const severity = state.current?.severity ?? DEFAULT_SNACKBAR_SEVERITY;
  const message = state.current && resolveMessage(state.current.message, t);
  const action = state.current?.action;

  function handleActionSelect() {
    action?.onSelect();
    dispatch({ type: "close" });
  }

  return (
    <SnackbarContext value={contextValue}>
      {children}

      <Snackbar
        key={state.current?.key}
        open={state.open}
        onClose={handleClose}
        autoHideDuration={
          state.current?.durationMs ?? defaultDurationMs(severity)
        }
        // Top on every screen size: at the bottom of a phone it would sit on
        // the board's Go back, Go home and Backspace buttons, and an error
        // stays there until it is closed.
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        slotProps={{ transition: { onExited: handleExited } }}
        sx={(theme) =>
          isSmallScreen
            ? {
                right: safeAreaGutter(theme.spacing(1), "right"),
                left: safeAreaGutter(theme.spacing(1), "left"),
              }
            : {}
        }
      >
        <Alert
          role={isUrgent(severity) ? "alert" : "status"}
          closeText={t(m.close)}
          action={
            action && (
              <Button color="inherit" size="small" onClick={handleActionSelect}>
                {resolveMessage(action.label, t)}
              </Button>
            )
          }
          severity={severity}
          onClose={handleClose}
          sx={(theme) => ({
            width: "100%",
            color: theme.vars.palette.SnackbarContent.color,
            backgroundColor: theme.vars.palette.SnackbarContent.bg,
            boxShadow: theme.vars.shadows[6],
            [`& .${alertClasses.icon}`]: {
              color: theme.colorSchemes.dark?.palette[severity].main,
              ...theme.applyStyles("dark", {
                color: theme.colorSchemes.light?.palette[severity].main,
              }),
            },
          })}
        >
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext>
  );
}

function resolveMessage(message: SnackbarMessage, t: Translate): string {
  return typeof message === "function" ? message(t) : message;
}

function isUrgent(severity: SnackbarSeverity) {
  return severity === "error" || severity === "warning";
}

function defaultDurationMs(severity: SnackbarSeverity): number | null {
  return isUrgent(severity) ? null : DEFAULT_SNACKBAR_DURATION_MS;
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
