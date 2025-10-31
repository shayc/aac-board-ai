import { use } from "react";
import { SnackbarContext, type SnackbarContextValue } from "./SnackbarContext";

export function useSnackbar(): SnackbarContextValue {
  const context = use(SnackbarContext);

  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }

  return context;
}
