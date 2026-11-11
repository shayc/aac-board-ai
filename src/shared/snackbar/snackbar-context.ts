import type { Translate } from "@shared/language/use-translate";
import { createContext } from "react";

export type SnackbarSeverity = "success" | "error" | "info" | "warning";
export type SnackbarMessage = string | ((t: Translate) => string);

/** A button shown in place of Close. Selecting it also closes the snackbar. */
export interface SnackbarActionOptions {
  label: SnackbarMessage;
  onSelect: () => void;
}

export interface SnackbarOptions {
  message: SnackbarMessage;
  severity?: SnackbarSeverity;
  durationMs?: number;
  action?: SnackbarActionOptions;
}

export interface SnackbarContextValue {
  showSnackbar: (options: SnackbarOptions | string) => void;
}

export const SnackbarContext = createContext<SnackbarContextValue | null>(null);
