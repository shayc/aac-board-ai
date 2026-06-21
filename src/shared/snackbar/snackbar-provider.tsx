import Alert from "@mui/material/Alert";
import Snackbar, { type SnackbarCloseReason } from "@mui/material/Snackbar";
import useMediaQuery from "@mui/material/useMediaQuery";
import { type ReactNode, useReducer, useRef } from "react";
import {
  SnackbarContext,
  type SnackbarContextValue,
  type SnackbarOptions,
  type SnackbarSeverity,
} from "./snackbar-context";

const DEFAULT_SNACKBAR_SEVERITY: SnackbarSeverity = "info";

interface SnackbarMessage extends SnackbarOptions {
  key: number;
}

interface SnackbarState {
  queue: SnackbarMessage[];
  current: SnackbarMessage | undefined;
  open: boolean;
}

type SnackbarAction =
  | { type: "show"; message: SnackbarMessage }
  | { type: "close" }
  | { type: "exited" };

const initialState: SnackbarState = {
  queue: [],
  current: undefined,
  open: false,
};

export interface SnackbarProviderProps {
  children: ReactNode;
}

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  const [state, dispatch] = useReducer(snackbarReducer, initialState);
  const nextKeyRef = useRef(0);
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  const showSnackbar = (options: SnackbarOptions | string) => {
    const snackbarOptions: SnackbarOptions =
      typeof options === "string" ? { message: options } : options;

    const message: SnackbarMessage = {
      ...snackbarOptions,
      key: nextKeyRef.current++,
    };
    dispatch({ type: "show", message });
  };

  const handleClose = (
    _event?: React.SyntheticEvent | Event,
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

  return (
    <SnackbarContext value={contextValue}>
      {children}

      <Snackbar
        key={state.current?.key}
        open={state.open}
        autoHideDuration={state.current?.duration ?? 4000}
        anchorOrigin={{
          vertical: isSmallScreen ? "bottom" : "top",
          horizontal: "center",
        }}
        onClose={handleClose}
        slotProps={{ transition: { onExited: handleExited } }}
      >
        <Alert
          severity={state.current?.severity ?? DEFAULT_SNACKBAR_SEVERITY}
          action={state.current?.action}
          onClose={handleClose}
          sx={{ width: "100%" }}
        >
          {state.current?.message}
        </Alert>
      </Snackbar>
    </SnackbarContext>
  );
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
          queue: [...state.queue, action.message],
          open: false,
        };
      }

      return { ...state, current: action.message, open: true };
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
