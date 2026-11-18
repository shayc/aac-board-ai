import type { Translate } from "@shared/language/use-translate";
import { createContext } from "react";

export type SnackbarSeverity = "success" | "error" | "info" | "warning";
type SnackbarMessage = string | ((t: Translate) => string);

export interface SnackbarOptions {
  message: SnackbarMessage;
  severity?: SnackbarSeverity;
  durationMs?: number;
}

export interface SnackbarContextValue {
  showSnackbar: (options: SnackbarOptions) => void;
}

export const SnackbarContext = createContext<SnackbarContextValue | null>(null);
