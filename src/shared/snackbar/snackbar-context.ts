import type { Translate } from "@shared/language/use-translate";
import { createContext, type ReactNode } from "react";

export type SnackbarSeverity = "success" | "error" | "info" | "warning";
type SnackbarMessage = string | ((t: Translate) => string);

export interface SnackbarOptions {
  message: SnackbarMessage;
  severity?: SnackbarSeverity;
  durationMs?: number;
  action?: ReactNode;
}

export interface SnackbarContextValue {
  showSnackbar: (options: SnackbarOptions | string) => void;
}

export const SnackbarContext = createContext<SnackbarContextValue | null>(null);

/** Registers an element to host snackbars; returns its unregister function. */
export type RegisterSnackbarOutlet = (outlet: HTMLElement) => () => void;

export const SnackbarOutletContext =
  createContext<RegisterSnackbarOutlet | null>(null);
