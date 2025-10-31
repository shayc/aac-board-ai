import Snackbar from "@mui/material/Snackbar";
import { type ReactNode, useState } from "react";
import {
  SnackbarContext,
  type SnackbarContextValue,
  type SnackbarOptions,
} from "./SnackbarContext";

export interface SnackbarProviderProps {
  children: ReactNode;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity?: "success" | "error" | "warning" | "info";
  duration: number;
  action?: ReactNode;
}

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  const [snackbarState, setSnackbarState] = useState<SnackbarState>({
    open: false,
    message: "",
    duration: 4000,
  });

  const [queue, setQueue] = useState<SnackbarOptions[]>([]);

  const showSnackbar = (options: SnackbarOptions | string) => {
    const snackbarOptions: SnackbarOptions =
      typeof options === "string" ? { message: options } : options;

    setQueue((prev) => [...prev, snackbarOptions]);
  };

  const processQueue = () => {
    if (queue.length > 0 && !snackbarState.open) {
      const nextSnackbar = queue[0];
      setSnackbarState({
        open: true,
        message: nextSnackbar.message,
        severity: nextSnackbar.severity,
        duration: nextSnackbar.duration ?? 4000,
      });
      setQueue((prev) => prev.slice(1));
    }
  };

  // Process queue when it changes or when snackbar closes
  if (queue.length > 0 && !snackbarState.open) {
    processQueue();
  }

  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setSnackbarState((prev) => ({ ...prev, open: false }));
  };

  const contextValue: SnackbarContextValue = {
    showSnackbar,
  };

  return (
    <SnackbarContext value={contextValue}>
      {children}

      <Snackbar
        open={snackbarState.open}
        autoHideDuration={snackbarState.duration}
        message={snackbarState.message}
        action={snackbarState.action}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={handleClose}
      />
    </SnackbarContext>
  );
}
