import { useContext } from "react";
import { SnackbarContext, type SnackbarContextValue } from "./SnackbarProvider";

export function useSnackbar(): SnackbarContextValue {
  const context = useContext(SnackbarContext);
  
  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  
  return context;
}