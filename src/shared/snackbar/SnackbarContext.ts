import { createContext, type ReactNode } from "react";

export type SnackbarSeverity = "success" | "error" | "info" | "warning";

export interface SnackbarOptions {
  message: string;
  severity?: SnackbarSeverity;
  duration?: number;
  action?: ReactNode;
}

export interface SnackbarContextValue {
  showSnackbar: (options: SnackbarOptions | string) => void;
}

export const SnackbarContext = createContext<SnackbarContextValue | null>(null);
