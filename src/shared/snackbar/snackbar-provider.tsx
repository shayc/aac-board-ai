import Alert from "@mui/material/Alert";
import Snackbar, { type SnackbarCloseReason } from "@mui/material/Snackbar";
import { type Theme, useColorScheme } from "@mui/material/styles";
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
import { SnackbarAnnouncement } from "./snackbar-announcement";

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
  const { colorScheme } = useColorScheme();

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
  const durationMs = state.current?.durationMs ?? defaultDurationMs(severity);
  const inverseColorScheme = colorScheme === "dark" ? "light" : "dark";

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
        slotProps={{
          root: { role: "region", "aria-label": t(m.notifications) },
          transition: { onExited: handleExited },
        }}
        className={isError ? undefined : inverseColorScheme}
        sx={overAppBar}
      >
        <Alert
          role="presentation"
          closeText={t(m.close)}
          severity={severity}
          action={state.current?.action}
          variant={isError ? "filled" : "standard"}
          onClose={handleClose}
          sx={[
            { width: "100%", minWidth: { sm: 344 }, boxShadow: 6 },
            !isError && paperSurface,
          ]}
        >
          {message}
          <SnackbarAnnouncement role={isError ? "alert" : "status"}>
            {message}
          </SnackbarAnnouncement>
        </Alert>
      </Snackbar>
    </SnackbarContext>
  );
}

function paperSurface(theme: Theme) {
  return {
    backgroundColor: theme.vars.palette.background.paper,
    color: theme.vars.palette.text.primary,
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
