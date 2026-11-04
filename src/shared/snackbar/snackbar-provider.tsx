import CloseIcon from "@mui/icons-material/Close";
import Alert, { alertClasses } from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Snackbar, { type SnackbarCloseReason } from "@mui/material/Snackbar";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { STATUS_DARK, STATUS_LIGHT } from "@shared/theme/theme-colors";
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
  const action = state.current?.action && (
    <>
      {state.current.action}
      <IconButton
        aria-label={t(m.close)}
        title={t(m.close)}
        size="small"
        color="inherit"
        onClick={() => handleClose()}
      >
        <CloseIcon fontSize="small" />
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
          closeText={t(m.close)}
          action={action}
          severity={severity}
          variant={severity === "error" ? "filled" : "standard"}
          onClose={handleClose}
          sx={[
            (theme) => ({
              width: "100%",
              boxShadow: theme.vars.shadows[6],
            }),
            severity !== "error" &&
              ((theme) => ({
                color: theme.vars.palette.SnackbarContent.color,
                backgroundColor: theme.vars.palette.SnackbarContent.bg,
                [`& .${alertClasses.icon}`]: {
                  color: STATUS_DARK[severity],
                  ...theme.applyStyles("dark", {
                    color: STATUS_LIGHT[severity],
                  }),
                },
              })),
          ]}
        >
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext>
  );
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
