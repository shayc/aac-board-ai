import Alert, { alertClasses } from "@mui/material/Alert";
import Snackbar, { type SnackbarCloseReason } from "@mui/material/Snackbar";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import {
  type ReactNode,
  type SyntheticEvent,
  useEffect,
  useReducer,
  useRef,
} from "react";
import {
  SnackbarContext,
  type SnackbarContextValue,
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

  // A waiting message closes the current one only once it has rendered open.
  // Closed before it mounts, a snackbar never exits, and the queue stalls.
  const hasQueuedSnackbar = state.queue.length > 0;
  useEffect(() => {
    if (hasQueuedSnackbar && state.open) {
      dispatch({ type: "close" });
    }
  }, [hasQueuedSnackbar, state.open]);

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
        autoHideDuration={
          state.current?.durationMs ?? defaultDurationMs(severity)
        }
        anchorOrigin={{
          vertical: isSmallScreen ? "bottom" : "top",
          horizontal: "center",
        }}
        slotProps={{ transition: { onExited: handleExited } }}
      >
        <Alert
          role={isUrgent(severity) ? "alert" : "status"}
          closeText={t(m.close)}
          action={state.current?.action}
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
        return { ...state, queue: [...state.queue, action.snackbar] };
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
