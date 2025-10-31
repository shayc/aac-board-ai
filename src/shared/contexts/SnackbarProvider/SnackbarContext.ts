import { createContext, type ReactNode } from "react";

export interface SnackbarOptions {
  message: string;
  duration?: number;
  action?: ReactNode;
}

export interface SnackbarContextValue {
  showSnackbar: (options: SnackbarOptions | string) => void;
}

export const SnackbarContext = createContext<SnackbarContextValue | null>(null);
