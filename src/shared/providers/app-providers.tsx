import { LanguageProvider } from "@shared/language/language-provider";
import { SnackbarProvider } from "@shared/snackbar/snackbar-provider";
import { ThemeProvider } from "@shared/theme/theme-provider";
import type { ReactNode } from "react";

export interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <SnackbarProvider>{children}</SnackbarProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
