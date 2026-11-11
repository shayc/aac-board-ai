import Alert, { alertClasses } from "@mui/material/Alert";
import Snackbar, { type SnackbarCloseReason } from "@mui/material/Snackbar";
import type { Theme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { safeAreaGutter } from "@shared/theme/safe-area";
import { type ReactNode, type SyntheticEvent, useReducer, useRef } from "react";
import { createPortal } from "react-dom";
import {
  SnackbarContext,
  type SnackbarContextValue,
  SnackbarOutletContext,
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
  outlets: readonly HTMLElement[];
}

type SnackbarAction =
  | { type: "show"; snackbar: QueuedSnackbar }
  | { type: "close" }
  | { type: "exited" }
  | { type: "outletAdded"; outlet: HTMLElement }
  | { type: "outletRemoved"; outlet: HTMLElement };

const initialState: SnackbarState = {
  queue: [],
  current: undefined,
  open: false,
  outlets: [],
};

interface SnackbarProviderProps {
  children: ReactNode;
}

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  const t = useTranslate();
  const [state, dispatch] = useReducer(snackbarReducer, initialState);
  const nextKeyRef = useRef(0);
  const outlet = state.outlets.at(-1);
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

  function registerOutlet(element: HTMLElement) {
    dispatch({ type: "outletAdded", outlet: element });

    return () => dispatch({ type: "outletRemoved", outlet: element });
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

  const snackbar = (
    <Snackbar
      key={state.current?.key}
      open={state.open}
      onClose={handleClose}
      autoHideDuration={
        state.current?.durationMs ?? defaultDurationMs(severity)
      }
      // Top of the page on every screen size: at the bottom of a phone it
      // would sit on the board's Go back, Go home and Backspace buttons, and
      // an error stays there until it is closed. A drawer's header holds its
      // Close button, so inside a drawer the snackbar sits at the bottom.
      anchorOrigin={{
        vertical: outlet ? "bottom" : "top",
        horizontal: "center",
      }}
      slotProps={{ transition: { onExited: handleExited } }}
      sx={(theme) =>
        snackbarPlacementSx(theme, {
          isInOutlet: outlet !== undefined,
          isSmallScreen,
        })
      }
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
  );

  return (
    <SnackbarContext value={contextValue}>
      <SnackbarOutletContext value={registerOutlet}>
        {children}
      </SnackbarOutletContext>

      {outlet ? createPortal(snackbar, outlet) : snackbar}
    </SnackbarContext>
  );
}

interface SnackbarPlacement {
  isInOutlet: boolean;
  isSmallScreen: boolean;
}

function snackbarPlacementSx(
  theme: Theme,
  { isInOutlet, isSmallScreen }: SnackbarPlacement,
) {
  const sideInsets = {
    right: safeAreaGutter(theme.spacing(1), "right"),
    left: safeAreaGutter(theme.spacing(1), "left"),
  };

  // Inside a drawer the snackbar belongs to the drawer: it spans the drawer's
  // width and moves with it instead of the viewport. MUI centers wide-screen
  // snackbars from a media query, which only the same query can override.
  if (isInOutlet) {
    const drawerInsets = {
      ...sideInsets,
      bottom: safeAreaGutter(theme.spacing(1), "bottom"),
    };

    return {
      position: "absolute",
      ...drawerInsets,
      [theme.breakpoints.up("sm")]: { ...drawerInsets, transform: "none" },
    };
  }

  return isSmallScreen ? sideInsets : {};
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

    case "exited":
      return showNextSnackbar(state);

    case "outletAdded":
      return moveSnackbar(state, [...state.outlets, action.outlet]);

    case "outletRemoved":
      return moveSnackbar(
        state,
        state.outlets.filter((outlet) => outlet !== action.outlet),
      );
  }
}

function showNextSnackbar(state: SnackbarState): SnackbarState {
  const [next, ...queue] = state.queue;

  return { ...state, current: next, queue, open: next !== undefined };
}

// Moving to another outlet mounts the snackbar afresh. One that was on its way
// out mounts already closed and never reports its exit, so the exit is
// finished here; otherwise nothing queued behind it would ever show.
function moveSnackbar(
  state: SnackbarState,
  outlets: readonly HTMLElement[],
): SnackbarState {
  const moved = { ...state, outlets };
  const isExiting = state.current !== undefined && !state.open;

  return isExiting ? showNextSnackbar(moved) : moved;
}
