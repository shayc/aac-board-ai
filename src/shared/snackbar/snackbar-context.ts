import type { Translate } from "@shared/language/use-translate";
import { createContext, type ReactNode } from "react";

export type SnackbarSeverity = "success" | "error" | "info" | "warning";
type SnackbarMessage = string | ((translate: Translate) => string);

export interface SnackbarOptions {
  message: SnackbarMessage;
  severity?: SnackbarSeverity;
  duration?: number;
  action?: ReactNode;
}

export interface SnackbarContextValue {
  showSnackbar: (options: SnackbarOptions | string) => void;
}

export const SnackbarContext = createContext<SnackbarContextValue | null>(null);
