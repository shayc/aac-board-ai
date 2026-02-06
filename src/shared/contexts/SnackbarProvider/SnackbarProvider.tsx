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

interface SnackbarMessage extends SnackbarOptions {
  key: number;
}

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  const [queue, setQueue] = useState<SnackbarMessage[]>([]);
  const [current, setCurrent] = useState<SnackbarMessage | undefined>();
  const [open, setOpen] = useState(false);

  if (!current && queue.length > 0) {
    setCurrent(queue[0]);
    setQueue((prev) => prev.slice(1));
    setOpen(true);
  }

  const showSnackbar = (options: SnackbarOptions | string) => {
    const snackbarOptions: SnackbarOptions =
      typeof options === "string" ? { message: options } : options;

    const message: SnackbarMessage = { ...snackbarOptions, key: Date.now() };

    if (current) {
      setQueue((prev) => [...prev, message]);
      setOpen(false);
    } else {
      setCurrent(message);
      setOpen(true);
    }
  };

  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  const handleExited = () => {
    setCurrent(undefined);
  };

  const contextValue: SnackbarContextValue = {
    showSnackbar,
  };

  return (
    <SnackbarContext value={contextValue}>
      {children}

      <Snackbar
        key={current?.key}
        open={open}
        autoHideDuration={current?.duration ?? 4000}
        message={current?.message ?? ""}
        action={current?.action}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={handleClose}
        slotProps={{ transition: { onExited: handleExited } }}
      />
    </SnackbarContext>
  );
}
